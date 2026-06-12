namespace BuildEstate.Domain.Enums;

public enum AuditRecordStatus
{
    Planned = 0,
    InProgress = 1,
    FindingsRecorded = 2,
    ActionsRequired = 3,
    RemediationInProgress = 4,
    Verified = 5,
    Closed = 6
}
