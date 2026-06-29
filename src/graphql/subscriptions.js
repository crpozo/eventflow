/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateBadge = /* GraphQL */ `
  subscription OnCreateBadge($filter: ModelSubscriptionBadgeFilterInput) {
    onCreateBadge(filter: $filter) {
      id
      frontDesign
      backDesign
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateBadge = /* GraphQL */ `
  subscription OnUpdateBadge($filter: ModelSubscriptionBadgeFilterInput) {
    onUpdateBadge(filter: $filter) {
      id
      frontDesign
      backDesign
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteBadge = /* GraphQL */ `
  subscription OnDeleteBadge($filter: ModelSubscriptionBadgeFilterInput) {
    onDeleteBadge(filter: $filter) {
      id
      frontDesign
      backDesign
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreatePaymentLog = /* GraphQL */ `
  subscription OnCreatePaymentLog(
    $filter: ModelSubscriptionPaymentLogFilterInput
  ) {
    onCreatePaymentLog(filter: $filter) {
      id
      eventattendeeID
      status
      type
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdatePaymentLog = /* GraphQL */ `
  subscription OnUpdatePaymentLog(
    $filter: ModelSubscriptionPaymentLogFilterInput
  ) {
    onUpdatePaymentLog(filter: $filter) {
      id
      eventattendeeID
      status
      type
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeletePaymentLog = /* GraphQL */ `
  subscription OnDeletePaymentLog(
    $filter: ModelSubscriptionPaymentLogFilterInput
  ) {
    onDeletePaymentLog(filter: $filter) {
      id
      eventattendeeID
      status
      type
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreateEventAttendee = /* GraphQL */ `
  subscription OnCreateEventAttendee(
    $filter: ModelSubscriptionEventAttendeeFilterInput
  ) {
    onCreateEventAttendee(filter: $filter) {
      id
      eventID
      attendeeID
      email
      authorized
      checkIn
      formAnswers
      ticket
      allowContact
      quantity
      scanned
      profileURL
      PaymentLogs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateEventAttendee = /* GraphQL */ `
  subscription OnUpdateEventAttendee(
    $filter: ModelSubscriptionEventAttendeeFilterInput
  ) {
    onUpdateEventAttendee(filter: $filter) {
      id
      eventID
      attendeeID
      email
      authorized
      checkIn
      formAnswers
      ticket
      allowContact
      quantity
      scanned
      profileURL
      PaymentLogs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteEventAttendee = /* GraphQL */ `
  subscription OnDeleteEventAttendee(
    $filter: ModelSubscriptionEventAttendeeFilterInput
  ) {
    onDeleteEventAttendee(filter: $filter) {
      id
      eventID
      attendeeID
      email
      authorized
      checkIn
      formAnswers
      ticket
      allowContact
      quantity
      scanned
      profileURL
      PaymentLogs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreateForm = /* GraphQL */ `
  subscription OnCreateForm($filter: ModelSubscriptionFormFilterInput) {
    onCreateForm(filter: $filter) {
      id
      questions
      Event {
        id
        title
        description
        careerID
        category
        location
        date
        startDate
        endDate
        timezone
        sendCertificates
        certificate
        certificatePosition
        certificatesSentAt
        contactTemplate
        termsCondition
        totalScannedTicket
        maxRegs
        eventIdUSFQ
        periodoUSFQ
        usuarioUSFQ
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        eventLandingId
        eventFormId
        eventBadgeId
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      formEventId
      __typename
    }
  }
`;
export const onUpdateForm = /* GraphQL */ `
  subscription OnUpdateForm($filter: ModelSubscriptionFormFilterInput) {
    onUpdateForm(filter: $filter) {
      id
      questions
      Event {
        id
        title
        description
        careerID
        category
        location
        date
        startDate
        endDate
        timezone
        sendCertificates
        certificate
        certificatePosition
        certificatesSentAt
        contactTemplate
        termsCondition
        totalScannedTicket
        maxRegs
        eventIdUSFQ
        periodoUSFQ
        usuarioUSFQ
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        eventLandingId
        eventFormId
        eventBadgeId
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      formEventId
      __typename
    }
  }
`;
export const onDeleteForm = /* GraphQL */ `
  subscription OnDeleteForm($filter: ModelSubscriptionFormFilterInput) {
    onDeleteForm(filter: $filter) {
      id
      questions
      Event {
        id
        title
        description
        careerID
        category
        location
        date
        startDate
        endDate
        timezone
        sendCertificates
        certificate
        certificatePosition
        certificatesSentAt
        contactTemplate
        termsCondition
        totalScannedTicket
        maxRegs
        eventIdUSFQ
        periodoUSFQ
        usuarioUSFQ
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        eventLandingId
        eventFormId
        eventBadgeId
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      formEventId
      __typename
    }
  }
`;
export const onCreateLanding = /* GraphQL */ `
  subscription OnCreateLanding($filter: ModelSubscriptionLandingFilterInput) {
    onCreateLanding(filter: $filter) {
      id
      active
      Event {
        id
        title
        description
        careerID
        category
        location
        date
        startDate
        endDate
        timezone
        sendCertificates
        certificate
        certificatePosition
        certificatesSentAt
        contactTemplate
        termsCondition
        totalScannedTicket
        maxRegs
        eventIdUSFQ
        periodoUSFQ
        usuarioUSFQ
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        eventLandingId
        eventFormId
        eventBadgeId
        __typename
      }
      title
      description
      mainBanner
      location
      cost
      ticketTitle
      ticketPrice
      extraInfo
      userConsentCheck
      metaScripts
      galleryPhotos
      partnerLogos
      customHtml
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      landingEventId
      __typename
    }
  }
`;
export const onUpdateLanding = /* GraphQL */ `
  subscription OnUpdateLanding($filter: ModelSubscriptionLandingFilterInput) {
    onUpdateLanding(filter: $filter) {
      id
      active
      Event {
        id
        title
        description
        careerID
        category
        location
        date
        startDate
        endDate
        timezone
        sendCertificates
        certificate
        certificatePosition
        certificatesSentAt
        contactTemplate
        termsCondition
        totalScannedTicket
        maxRegs
        eventIdUSFQ
        periodoUSFQ
        usuarioUSFQ
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        eventLandingId
        eventFormId
        eventBadgeId
        __typename
      }
      title
      description
      mainBanner
      location
      cost
      ticketTitle
      ticketPrice
      extraInfo
      userConsentCheck
      metaScripts
      galleryPhotos
      partnerLogos
      customHtml
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      landingEventId
      __typename
    }
  }
`;
export const onDeleteLanding = /* GraphQL */ `
  subscription OnDeleteLanding($filter: ModelSubscriptionLandingFilterInput) {
    onDeleteLanding(filter: $filter) {
      id
      active
      Event {
        id
        title
        description
        careerID
        category
        location
        date
        startDate
        endDate
        timezone
        sendCertificates
        certificate
        certificatePosition
        certificatesSentAt
        contactTemplate
        termsCondition
        totalScannedTicket
        maxRegs
        eventIdUSFQ
        periodoUSFQ
        usuarioUSFQ
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        eventLandingId
        eventFormId
        eventBadgeId
        __typename
      }
      title
      description
      mainBanner
      location
      cost
      ticketTitle
      ticketPrice
      extraInfo
      userConsentCheck
      metaScripts
      galleryPhotos
      partnerLogos
      customHtml
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      landingEventId
      __typename
    }
  }
`;
export const onCreateAttendee = /* GraphQL */ `
  subscription OnCreateAttendee($filter: ModelSubscriptionAttendeeFilterInput) {
    onCreateAttendee(filter: $filter) {
      id
      EventAttendees {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateAttendee = /* GraphQL */ `
  subscription OnUpdateAttendee($filter: ModelSubscriptionAttendeeFilterInput) {
    onUpdateAttendee(filter: $filter) {
      id
      EventAttendees {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteAttendee = /* GraphQL */ `
  subscription OnDeleteAttendee($filter: ModelSubscriptionAttendeeFilterInput) {
    onDeleteAttendee(filter: $filter) {
      id
      EventAttendees {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreateEvent = /* GraphQL */ `
  subscription OnCreateEvent($filter: ModelSubscriptionEventFilterInput) {
    onCreateEvent(filter: $filter) {
      id
      title
      description
      Landing {
        id
        active
        title
        description
        mainBanner
        location
        cost
        ticketTitle
        ticketPrice
        extraInfo
        userConsentCheck
        metaScripts
        galleryPhotos
        partnerLogos
        customHtml
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        landingEventId
        __typename
      }
      careerID
      Form {
        id
        questions
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        formEventId
        __typename
      }
      EventAttendees {
        nextToken
        startedAt
        __typename
      }
      category
      location
      date
      startDate
      endDate
      timezone
      sendCertificates
      certificate
      certificatePosition
      certificatesSentAt
      contactTemplate
      termsCondition
      totalScannedTicket
      maxRegs
      eventIdUSFQ
      periodoUSFQ
      usuarioUSFQ
      Badge {
        id
        frontDesign
        backDesign
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      eventLandingId
      eventFormId
      eventBadgeId
      __typename
    }
  }
`;
export const onUpdateEvent = /* GraphQL */ `
  subscription OnUpdateEvent($filter: ModelSubscriptionEventFilterInput) {
    onUpdateEvent(filter: $filter) {
      id
      title
      description
      Landing {
        id
        active
        title
        description
        mainBanner
        location
        cost
        ticketTitle
        ticketPrice
        extraInfo
        userConsentCheck
        metaScripts
        galleryPhotos
        partnerLogos
        customHtml
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        landingEventId
        __typename
      }
      careerID
      Form {
        id
        questions
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        formEventId
        __typename
      }
      EventAttendees {
        nextToken
        startedAt
        __typename
      }
      category
      location
      date
      startDate
      endDate
      timezone
      sendCertificates
      certificate
      certificatePosition
      certificatesSentAt
      contactTemplate
      termsCondition
      totalScannedTicket
      maxRegs
      eventIdUSFQ
      periodoUSFQ
      usuarioUSFQ
      Badge {
        id
        frontDesign
        backDesign
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      eventLandingId
      eventFormId
      eventBadgeId
      __typename
    }
  }
`;
export const onDeleteEvent = /* GraphQL */ `
  subscription OnDeleteEvent($filter: ModelSubscriptionEventFilterInput) {
    onDeleteEvent(filter: $filter) {
      id
      title
      description
      Landing {
        id
        active
        title
        description
        mainBanner
        location
        cost
        ticketTitle
        ticketPrice
        extraInfo
        userConsentCheck
        metaScripts
        galleryPhotos
        partnerLogos
        customHtml
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        landingEventId
        __typename
      }
      careerID
      Form {
        id
        questions
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        formEventId
        __typename
      }
      EventAttendees {
        nextToken
        startedAt
        __typename
      }
      category
      location
      date
      startDate
      endDate
      timezone
      sendCertificates
      certificate
      certificatePosition
      certificatesSentAt
      contactTemplate
      termsCondition
      totalScannedTicket
      maxRegs
      eventIdUSFQ
      periodoUSFQ
      usuarioUSFQ
      Badge {
        id
        frontDesign
        backDesign
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      eventLandingId
      eventFormId
      eventBadgeId
      __typename
    }
  }
`;
export const onCreateCareer = /* GraphQL */ `
  subscription OnCreateCareer($filter: ModelSubscriptionCareerFilterInput) {
    onCreateCareer(filter: $filter) {
      id
      title
      description
      Events {
        nextToken
        startedAt
        __typename
      }
      costCenter
      areaID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateCareer = /* GraphQL */ `
  subscription OnUpdateCareer($filter: ModelSubscriptionCareerFilterInput) {
    onUpdateCareer(filter: $filter) {
      id
      title
      description
      Events {
        nextToken
        startedAt
        __typename
      }
      costCenter
      areaID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteCareer = /* GraphQL */ `
  subscription OnDeleteCareer($filter: ModelSubscriptionCareerFilterInput) {
    onDeleteCareer(filter: $filter) {
      id
      title
      description
      Events {
        nextToken
        startedAt
        __typename
      }
      costCenter
      areaID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreateArea = /* GraphQL */ `
  subscription OnCreateArea($filter: ModelSubscriptionAreaFilterInput) {
    onCreateArea(filter: $filter) {
      id
      title
      description
      Carreras {
        nextToken
        startedAt
        __typename
      }
      costCenter
      campusID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateArea = /* GraphQL */ `
  subscription OnUpdateArea($filter: ModelSubscriptionAreaFilterInput) {
    onUpdateArea(filter: $filter) {
      id
      title
      description
      Carreras {
        nextToken
        startedAt
        __typename
      }
      costCenter
      campusID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteArea = /* GraphQL */ `
  subscription OnDeleteArea($filter: ModelSubscriptionAreaFilterInput) {
    onDeleteArea(filter: $filter) {
      id
      title
      description
      Carreras {
        nextToken
        startedAt
        __typename
      }
      costCenter
      campusID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreateCampus = /* GraphQL */ `
  subscription OnCreateCampus($filter: ModelSubscriptionCampusFilterInput) {
    onCreateCampus(filter: $filter) {
      id
      title
      CampusArea {
        nextToken
        startedAt
        __typename
      }
      description
      phone
      email
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateCampus = /* GraphQL */ `
  subscription OnUpdateCampus($filter: ModelSubscriptionCampusFilterInput) {
    onUpdateCampus(filter: $filter) {
      id
      title
      CampusArea {
        nextToken
        startedAt
        __typename
      }
      description
      phone
      email
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteCampus = /* GraphQL */ `
  subscription OnDeleteCampus($filter: ModelSubscriptionCampusFilterInput) {
    onDeleteCampus(filter: $filter) {
      id
      title
      CampusArea {
        nextToken
        startedAt
        __typename
      }
      description
      phone
      email
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreateRole = /* GraphQL */ `
  subscription OnCreateRole($filter: ModelSubscriptionRoleFilterInput) {
    onCreateRole(filter: $filter) {
      id
      name
      areas
      users {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateRole = /* GraphQL */ `
  subscription OnUpdateRole($filter: ModelSubscriptionRoleFilterInput) {
    onUpdateRole(filter: $filter) {
      id
      name
      areas
      users {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteRole = /* GraphQL */ `
  subscription OnDeleteRole($filter: ModelSubscriptionRoleFilterInput) {
    onDeleteRole(filter: $filter) {
      id
      name
      areas
      users {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser($filter: ModelSubscriptionUserFilterInput) {
    onCreateUser(filter: $filter) {
      id
      email
      name
      roleID
      role {
        id
        name
        areas
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      campusIDs
      areaIDs
      eventIDs
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser($filter: ModelSubscriptionUserFilterInput) {
    onUpdateUser(filter: $filter) {
      id
      email
      name
      roleID
      role {
        id
        name
        areas
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      campusIDs
      areaIDs
      eventIDs
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser($filter: ModelSubscriptionUserFilterInput) {
    onDeleteUser(filter: $filter) {
      id
      email
      name
      roleID
      role {
        id
        name
        areas
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      campusIDs
      areaIDs
      eventIDs
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreateEventPermission = /* GraphQL */ `
  subscription OnCreateEventPermission(
    $filter: ModelSubscriptionEventPermissionFilterInput
  ) {
    onCreateEventPermission(filter: $filter) {
      id
      userID
      eventID
      capabilities
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateEventPermission = /* GraphQL */ `
  subscription OnUpdateEventPermission(
    $filter: ModelSubscriptionEventPermissionFilterInput
  ) {
    onUpdateEventPermission(filter: $filter) {
      id
      userID
      eventID
      capabilities
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteEventPermission = /* GraphQL */ `
  subscription OnDeleteEventPermission(
    $filter: ModelSubscriptionEventPermissionFilterInput
  ) {
    onDeleteEventPermission(filter: $filter) {
      id
      userID
      eventID
      capabilities
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
