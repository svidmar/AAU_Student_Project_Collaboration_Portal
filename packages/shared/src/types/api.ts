/**
 * Types for Pure API responses
 * Based on https://vbn.aau.dk/ws/api/524/api-docs/index.html
 */

/**
 * Generic Pure API paginated response
 */
export interface PureApiResponse<T> {
  count: number;
  pageInformation?: {
    offset: number;
    size: number;
  };
  items: T[];
}

/**
 * Pure API Person
 */
export interface PurePerson {
  uuid: string;
  name: {
    firstName: string;
    lastName: string;
  };
  role?: {
    term?: {
      text: string;
    };
  };
}

/**
 * Pure API Organization
 */
export interface PureOrganization {
  uuid: string;
  name: {
    text: string;
  };
  type?: {
    term?: {
      text: string;
    };
  };
  addresses?: Array<{
    country?: {
      term?: {
        text: string;
      };
    };
    city?: string;
    postalCode?: string;
    geoLocation?: {
      point: {
        latitude: number;
        longitude: number;
      };
    };
  }>;
}

/**
 * Pure API External Organization
 */
export interface PureExternalOrganization {
  pureId?: number;
  uuid: string;
  name: PureLocalizedText;
  type?: {
    pureId?: number;
    uri: string;
    term?: PureLocalizedText;
  };
  address?: {
    address1?: string;
    postalCode?: string;
    city?: string;
    geoLocation?: {
      point: string; // Format: "lat,lng" e.g., "-1.2920659,36.8219462"
      calculatedPoint?: string;
    };
    country?: {
      pureId?: number;
      uri?: string;
      term?: PureLocalizedText;
    };
  };
}

/**
 * Localized text from Pure API
 */
export interface PureLocalizedText {
  formatted?: boolean;
  text: Array<{
    locale: string;
    value: string;
  }>;
}

/**
 * Pure API Author (different from Person)
 */
export interface PureAuthor {
  PureId?: number;
  name: {
    firstName: string;
    lastName: string;
  };
  email?: string;
  studentID?: string;
}

/**
 * Pure API Supervisor
 */
export interface PureSupervisor {
  pureId?: number;
  person?: {
    uuid: string;
    externalId?: string;
    externalIdSource?: string;
    externallyManaged?: boolean;
    name?: {
      formatted?: boolean;
      text: Array<{
        value: string;
      }>;
    };
    link?: {
      ref: string;
      href: string;
    };
  };
  supervisorType?: {
    pureId?: number;
    uri?: string;
    term?: PureLocalizedText;
  };
}

/**
 * Pure API External Collaborator
 */
export interface PureExternalCollaborator {
  pureId?: number;
  externalOrganisation: PureExternalOrganization;
  name?: {
    firstName: string;
    lastName: string;
  };
  title?: string;
  email?: string;
  externalCollaboratorRole?: {
    pureId?: number;
    uri?: string;
    term?: PureLocalizedText;
  };
}

/**
 * Pure API Document
 */
export interface PureDocument {
  pureId?: number;
  title?: string;
  url?: string;
  fileName?: string;
  documentType?: {
    pureId?: number;
    uri?: string;
    term?: PureLocalizedText;
  };
  visibility?: {
    key: string;
    value?: PureLocalizedText;
  };
}

/**
 * Pure API Student Thesis Project (actual structure)
 */
export interface PureStudentProject {
  pureId?: number;
  uuid: string;
  title?: PureLocalizedText;
  abstract?: PureLocalizedText;
  type?: {
    pureId?: number;
    uri?: string;
    term?: PureLocalizedText;
  };
  publicationDate?: {
    year: number;
  };
  managingOrganization?: {
    uuid: string;
    name?: PureLocalizedText;
  };
  authors?: PureAuthor[];
  supervisors?: PureSupervisor[];
  externalCollaboration?: boolean;
  externalCollaborators?: PureExternalCollaborator[];
  documents?: PureDocument[];
  educationAssociations?: Array<{
    pureId?: number;
    education: {
      uuid: string;
      name: PureLocalizedText;
      type?: {
        term?: PureLocalizedText;
      };
    };
    semester?: {
      uuid: string;
      name: PureLocalizedText;
    };
  }>;
  info?: {
    createdDate?: string;
    modifiedDate?: string;
  };
}

/**
 * Pure API Education Program
 */
export interface PureEducation {
  uuid: string;
  name: PureLocalizedText;
  code?: string;
  type?: {
    term?: PureLocalizedText;
  };
}

/**
 * Pure API Allowed Types Response
 */
export interface PureAllowedTypesResponse {
  items: Array<{
    uri: string;
    term: {
      text: string;
    };
  }>;
}
