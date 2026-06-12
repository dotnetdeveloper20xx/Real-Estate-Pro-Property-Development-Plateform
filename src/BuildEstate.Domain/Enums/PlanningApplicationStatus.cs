namespace BuildEstate.Domain.Enums;

public enum PlanningApplicationStatus
{
    PreApplication = 0,
    Submitted = 1,
    Validated = 2,
    UnderReview = 3,
    CommitteeReview = 4,
    Approved = 5,
    ApprovedWithConditions = 6,
    Refused = 7,
    Appeal = 8,
    Withdrawn = 9
}
