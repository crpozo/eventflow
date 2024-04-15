/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createPaymentLog = /* GraphQL */ `
  mutation CreatePaymentLog(
    $input: CreatePaymentLogInput!
    $condition: ModelPaymentLogConditionInput
  ) {
    createPaymentLog(input: $input, condition: $condition) {
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
export const updatePaymentLog = /* GraphQL */ `
  mutation UpdatePaymentLog(
    $input: UpdatePaymentLogInput!
    $condition: ModelPaymentLogConditionInput
  ) {
    updatePaymentLog(input: $input, condition: $condition) {
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
export const deletePaymentLog = /* GraphQL */ `
  mutation DeletePaymentLog(
    $input: DeletePaymentLogInput!
    $condition: ModelPaymentLogConditionInput
  ) {
    deletePaymentLog(input: $input, condition: $condition) {
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
export const createEventAttendee = /* GraphQL */ `
  mutation CreateEventAttendee(
    $input: CreateEventAttendeeInput!
    $condition: ModelEventAttendeeConditionInput
  ) {
    createEventAttendee(input: $input, condition: $condition) {
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
export const updateEventAttendee = /* GraphQL */ `
  mutation UpdateEventAttendee(
    $input: UpdateEventAttendeeInput!
    $condition: ModelEventAttendeeConditionInput
  ) {
    updateEventAttendee(input: $input, condition: $condition) {
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
export const deleteEventAttendee = /* GraphQL */ `
  mutation DeleteEventAttendee(
    $input: DeleteEventAttendeeInput!
    $condition: ModelEventAttendeeConditionInput
  ) {
    deleteEventAttendee(input: $input, condition: $condition) {
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
export const createForm = /* GraphQL */ `
  mutation CreateForm(
    $input: CreateFormInput!
    $condition: ModelFormConditionInput
  ) {
    createForm(input: $input, condition: $condition) {
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
export const updateForm = /* GraphQL */ `
  mutation UpdateForm(
    $input: UpdateFormInput!
    $condition: ModelFormConditionInput
  ) {
    updateForm(input: $input, condition: $condition) {
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
export const deleteForm = /* GraphQL */ `
  mutation DeleteForm(
    $input: DeleteFormInput!
    $condition: ModelFormConditionInput
  ) {
    deleteForm(input: $input, condition: $condition) {
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
export const createLanding = /* GraphQL */ `
  mutation CreateLanding(
    $input: CreateLandingInput!
    $condition: ModelLandingConditionInput
  ) {
    createLanding(input: $input, condition: $condition) {
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
export const updateLanding = /* GraphQL */ `
  mutation UpdateLanding(
    $input: UpdateLandingInput!
    $condition: ModelLandingConditionInput
  ) {
    updateLanding(input: $input, condition: $condition) {
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
export const deleteLanding = /* GraphQL */ `
  mutation DeleteLanding(
    $input: DeleteLandingInput!
    $condition: ModelLandingConditionInput
  ) {
    deleteLanding(input: $input, condition: $condition) {
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
export const createAttendee = /* GraphQL */ `
  mutation CreateAttendee(
    $input: CreateAttendeeInput!
    $condition: ModelAttendeeConditionInput
  ) {
    createAttendee(input: $input, condition: $condition) {
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
export const updateAttendee = /* GraphQL */ `
  mutation UpdateAttendee(
    $input: UpdateAttendeeInput!
    $condition: ModelAttendeeConditionInput
  ) {
    updateAttendee(input: $input, condition: $condition) {
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
export const deleteAttendee = /* GraphQL */ `
  mutation DeleteAttendee(
    $input: DeleteAttendeeInput!
    $condition: ModelAttendeeConditionInput
  ) {
    deleteAttendee(input: $input, condition: $condition) {
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
export const createEvent = /* GraphQL */ `
  mutation CreateEvent(
    $input: CreateEventInput!
    $condition: ModelEventConditionInput
  ) {
    createEvent(input: $input, condition: $condition) {
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
export const updateEvent = /* GraphQL */ `
  mutation UpdateEvent(
    $input: UpdateEventInput!
    $condition: ModelEventConditionInput
  ) {
    updateEvent(input: $input, condition: $condition) {
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
export const deleteEvent = /* GraphQL */ `
  mutation DeleteEvent(
    $input: DeleteEventInput!
    $condition: ModelEventConditionInput
  ) {
    deleteEvent(input: $input, condition: $condition) {
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
export const createCareer = /* GraphQL */ `
  mutation CreateCareer(
    $input: CreateCareerInput!
    $condition: ModelCareerConditionInput
  ) {
    createCareer(input: $input, condition: $condition) {
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
export const updateCareer = /* GraphQL */ `
  mutation UpdateCareer(
    $input: UpdateCareerInput!
    $condition: ModelCareerConditionInput
  ) {
    updateCareer(input: $input, condition: $condition) {
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
export const deleteCareer = /* GraphQL */ `
  mutation DeleteCareer(
    $input: DeleteCareerInput!
    $condition: ModelCareerConditionInput
  ) {
    deleteCareer(input: $input, condition: $condition) {
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
export const createArea = /* GraphQL */ `
  mutation CreateArea(
    $input: CreateAreaInput!
    $condition: ModelAreaConditionInput
  ) {
    createArea(input: $input, condition: $condition) {
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
export const updateArea = /* GraphQL */ `
  mutation UpdateArea(
    $input: UpdateAreaInput!
    $condition: ModelAreaConditionInput
  ) {
    updateArea(input: $input, condition: $condition) {
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
export const deleteArea = /* GraphQL */ `
  mutation DeleteArea(
    $input: DeleteAreaInput!
    $condition: ModelAreaConditionInput
  ) {
    deleteArea(input: $input, condition: $condition) {
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
export const createCampus = /* GraphQL */ `
  mutation CreateCampus(
    $input: CreateCampusInput!
    $condition: ModelCampusConditionInput
  ) {
    createCampus(input: $input, condition: $condition) {
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
export const updateCampus = /* GraphQL */ `
  mutation UpdateCampus(
    $input: UpdateCampusInput!
    $condition: ModelCampusConditionInput
  ) {
    updateCampus(input: $input, condition: $condition) {
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
export const deleteCampus = /* GraphQL */ `
  mutation DeleteCampus(
    $input: DeleteCampusInput!
    $condition: ModelCampusConditionInput
  ) {
    deleteCampus(input: $input, condition: $condition) {
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
