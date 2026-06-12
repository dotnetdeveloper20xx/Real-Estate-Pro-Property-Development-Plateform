using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.UpdateContract;

/// <summary>
/// Handles updating an existing Contract entity.
/// Applies only non-null fields (partial update pattern), sets audit fields, and persists.
/// Throws EntityNotFoundException if the contract does not exist.
/// </summary>
public sealed class UpdateContractCommandHandler : IRequestHandler<UpdateContractCommand, ContractDto>
{
    private readonly IRepository<Contract> _contractRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UpdateContractCommandHandler(
        IRepository<Contract> contractRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _contractRepository = contractRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<ContractDto> Handle(UpdateContractCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepository.GetByIdAsync(request.Id, cancellationToken);
        if (contract is null)
        {
            throw new EntityNotFoundException(nameof(Contract), request.Id);
        }

        // Apply only non-null fields (partial update)
        if (request.Title is not null)
            contract.Title = request.Title;

        if (request.CounterpartyName is not null)
            contract.CounterpartyName = request.CounterpartyName;

        if (request.ContractValue.HasValue)
            contract.ContractValue = request.ContractValue.Value;

        if (request.Currency is not null)
            contract.Currency = request.Currency.ToUpperInvariant();

        if (request.StartDate.HasValue)
            contract.StartDate = request.StartDate.Value;

        if (request.EndDate.HasValue)
            contract.EndDate = request.EndDate.Value;

        if (request.RenewalDate.HasValue)
            contract.RenewalDate = request.RenewalDate.Value;

        if (request.TerminationClause is not null)
            contract.TerminationClause = request.TerminationClause;

        if (request.SpecialConditions is not null)
            contract.SpecialConditions = request.SpecialConditions;

        if (request.PaymentTerms is not null)
            contract.PaymentTerms = request.PaymentTerms;

        contract.UpdatedAt = DateTime.UtcNow;
        contract.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _contractRepository.Update(contract);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ContractDto>(contract);
    }
}
