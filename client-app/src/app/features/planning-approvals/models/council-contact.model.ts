/**
 * Full council contact entity returned from the API.
 */
export interface ICouncilContact {
  readonly id: string;
  readonly applicationId: string;
  readonly councilName: string;
  readonly planningOfficerName: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly createdAt: string;
}

/**
 * Payload for creating or updating a council contact.
 */
export interface ICreateUpdateCouncilContact {
  readonly councilName: string;
  readonly planningOfficerName: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
}
