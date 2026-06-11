using AutoMapper;
using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.LandAcquisition.Feasibility.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Feasibility.Commands.CreateOrUpdateFeasibility;

/// <summary>
/// Handles creation or update of a FeasibilityAssessment for a land opportunity.
/// Verifies the opportunity exists, calculates TotalCosts, EstimatedProfit, and RoiPercentage,
/// and optionally triggers a notification to FinanceDirector when marked ready for review.
/// </summary>
public sealed class CreateOrUpdateFeasibilityCommandHandler
    : IRequestHandler<CreateOrUpdateFeasibilityCommand, FeasibilityAssessmentDto>
{
    private readonly IRepository<FeasibilityAssessment> _feasibilityRepository;
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;
    private readonly IMapper _mapper;

    public CreateOrUpdateFeasibilityCommandHandler(
        IRepository<FeasibilityAssessment> feasibilityRepository,
        IRepository<LandOpportunity> opportunityRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        INotificationService notificationService,
        IMapper mapper)
    {
        _feasibilityRepository = feasibilityRepository;
        _opportunityRepository = opportunityRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
        _mapper = mapper;
    }

    public async Task<FeasibilityAssessmentDto> Handle(
        CreateOrUpdateFeasibilityCommand request,
        CancellationToken cancellationToken)
    {
        // Verify the opportunity exists
        var opportunity = await _opportunityRepository.GetByIdAsync(request.OpportunityId, cancellationToken);
        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.OpportunityId);
        }

        // Calculate derived financial fields
        var totalCosts = request.EstimatedLandCost
                       + request.EstimatedBuildCost
                       + request.ProfessionalFees
                       + request.FinanceCosts;

        var estimatedProfit = request.ExpectedSalesRevenue - totalCosts;

        var roiPercentage = totalCosts > 0
            ? ((request.ExpectedSalesRevenue - totalCosts) / totalCosts) * 100
            : 0m;

        // Check if an existing assessment exists for this opportunity
        var existingAssessment = await _feasibilityRepository.Query()
            .FirstOrDefaultAsync(f => f.OpportunityId == request.OpportunityId, cancellationToken);

        FeasibilityAssessment assessment;

        if (existingAssessment is not null)
        {
            // Update existing assessment
            existingAssessment.EstimatedLandCost = request.EstimatedLandCost;
            existingAssessment.EstimatedBuildCost = request.EstimatedBuildCost;
            existingAssessment.ProfessionalFees = request.ProfessionalFees;
            existingAssessment.FinanceCosts = request.FinanceCosts;
            existingAssessment.ExpectedSalesRevenue = request.ExpectedSalesRevenue;
            existingAssessment.TotalCosts = totalCosts;
            existingAssessment.EstimatedProfit = estimatedProfit;
            existingAssessment.RoiPercentage = roiPercentage;
            existingAssessment.Scenario = request.Scenario;
            existingAssessment.IsReadyForReview = request.IsReadyForReview;
            existingAssessment.UpdatedAt = DateTime.UtcNow;
            existingAssessment.UpdatedBy = _currentUserService.UserId ?? string.Empty;

            _feasibilityRepository.Update(existingAssessment);
            assessment = existingAssessment;
        }
        else
        {
            // Create new assessment
            assessment = new FeasibilityAssessment
            {
                OpportunityId = request.OpportunityId,
                EstimatedLandCost = request.EstimatedLandCost,
                EstimatedBuildCost = request.EstimatedBuildCost,
                ProfessionalFees = request.ProfessionalFees,
                FinanceCosts = request.FinanceCosts,
                ExpectedSalesRevenue = request.ExpectedSalesRevenue,
                TotalCosts = totalCosts,
                EstimatedProfit = estimatedProfit,
                RoiPercentage = roiPercentage,
                Scenario = request.Scenario,
                IsReadyForReview = request.IsReadyForReview,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId ?? string.Empty
            };

            await _feasibilityRepository.AddAsync(assessment, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // If marked ready for review, notify the Finance Director
        if (request.IsReadyForReview)
        {
            var message = $"Feasibility assessment for opportunity '{opportunity.Name}' is ready for review.";
            await _notificationService.SendToRoleAsync(
                "FinanceDirector",
                "FeasibilityReadyForReview",
                message,
                request.OpportunityId,
                cancellationToken);
        }

        return _mapper.Map<FeasibilityAssessmentDto>(assessment);
    }
}
