/* eslint-disable */
// this is an auto generated file. This will be overwritten

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
      authorized
      checkIn
      formAnswers
      ticket
      email
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
      authorized
      checkIn
      formAnswers
      ticket
      email
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
      authorized
      checkIn
      formAnswers
      ticket
      email
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
        contactName
        contactNumber
        termsCondition
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
        contactName
        contactNumber
        termsCondition
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
        contactName
        contactNumber
        termsCondition
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
        contactName
        contactNumber
        termsCondition
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
        contactName
        contactNumber
        termsCondition
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
        contactName
        contactNumber
        termsCondition
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
      contactName
      contactNumber
      termsCondition
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
      contactName
      contactNumber
      termsCondition
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
      contactName
      contactNumber
      termsCondition
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
