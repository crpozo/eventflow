/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getBadge = /* GraphQL */ `
  query GetBadge($id: ID!) {
    getBadge(id: $id) {
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
export const listBadges = /* GraphQL */ `
  query ListBadges(
    $filter: ModelBadgeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listBadges(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncBadges = /* GraphQL */ `
  query SyncBadges(
    $filter: ModelBadgeFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncBadges(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getPaymentLog = /* GraphQL */ `
  query GetPaymentLog($id: ID!) {
    getPaymentLog(id: $id) {
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
export const listPaymentLogs = /* GraphQL */ `
  query ListPaymentLogs(
    $filter: ModelPaymentLogFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPaymentLogs(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncPaymentLogs = /* GraphQL */ `
  query SyncPaymentLogs(
    $filter: ModelPaymentLogFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPaymentLogs(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const paymentLogsByEventattendeeID = /* GraphQL */ `
  query PaymentLogsByEventattendeeID(
    $eventattendeeID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelPaymentLogFilterInput
    $limit: Int
    $nextToken: String
  ) {
    paymentLogsByEventattendeeID(
      eventattendeeID: $eventattendeeID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getEventAttendee = /* GraphQL */ `
  query GetEventAttendee($id: ID!) {
    getEventAttendee(id: $id) {
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
export const listEventAttendees = /* GraphQL */ `
  query ListEventAttendees(
    $filter: ModelEventAttendeeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listEventAttendees(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncEventAttendees = /* GraphQL */ `
  query SyncEventAttendees(
    $filter: ModelEventAttendeeFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncEventAttendees(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const eventAttendeesByEventID = /* GraphQL */ `
  query EventAttendeesByEventID(
    $eventID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelEventAttendeeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    eventAttendeesByEventID(
      eventID: $eventID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const eventAttendeesByAttendeeID = /* GraphQL */ `
  query EventAttendeesByAttendeeID(
    $attendeeID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelEventAttendeeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    eventAttendeesByAttendeeID(
      attendeeID: $attendeeID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const eventAttendeesByEmail = /* GraphQL */ `
  query EventAttendeesByEmail(
    $email: String!
    $sortDirection: ModelSortDirection
    $filter: ModelEventAttendeeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    eventAttendeesByEmail(
      email: $email
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getForm = /* GraphQL */ `
  query GetForm($id: ID!) {
    getForm(id: $id) {
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
export const listForms = /* GraphQL */ `
  query ListForms(
    $filter: ModelFormFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listForms(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncForms = /* GraphQL */ `
  query SyncForms(
    $filter: ModelFormFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncForms(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getLanding = /* GraphQL */ `
  query GetLanding($id: ID!) {
    getLanding(id: $id) {
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
export const listLandings = /* GraphQL */ `
  query ListLandings(
    $filter: ModelLandingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLandings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncLandings = /* GraphQL */ `
  query SyncLandings(
    $filter: ModelLandingFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncLandings(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getAttendee = /* GraphQL */ `
  query GetAttendee($id: ID!) {
    getAttendee(id: $id) {
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
export const listAttendees = /* GraphQL */ `
  query ListAttendees(
    $filter: ModelAttendeeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAttendees(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncAttendees = /* GraphQL */ `
  query SyncAttendees(
    $filter: ModelAttendeeFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncAttendees(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getEvent = /* GraphQL */ `
  query GetEvent($id: ID!) {
    getEvent(id: $id) {
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
export const listEvents = /* GraphQL */ `
  query ListEvents(
    $filter: ModelEventFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listEvents(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        description
        careerID
        category
        location
        date
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncEvents = /* GraphQL */ `
  query SyncEvents(
    $filter: ModelEventFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncEvents(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        title
        description
        careerID
        category
        location
        date
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const eventsByCareerID = /* GraphQL */ `
  query EventsByCareerID(
    $careerID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelEventFilterInput
    $limit: Int
    $nextToken: String
  ) {
    eventsByCareerID(
      careerID: $careerID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        title
        description
        careerID
        category
        location
        date
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getCareer = /* GraphQL */ `
  query GetCareer($id: ID!) {
    getCareer(id: $id) {
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
export const listCareers = /* GraphQL */ `
  query ListCareers(
    $filter: ModelCareerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCareers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        description
        costCenter
        areaID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncCareers = /* GraphQL */ `
  query SyncCareers(
    $filter: ModelCareerFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncCareers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        title
        description
        costCenter
        areaID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const careersByAreaID = /* GraphQL */ `
  query CareersByAreaID(
    $areaID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelCareerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    careersByAreaID(
      areaID: $areaID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        title
        description
        costCenter
        areaID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getArea = /* GraphQL */ `
  query GetArea($id: ID!) {
    getArea(id: $id) {
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
export const listAreas = /* GraphQL */ `
  query ListAreas(
    $filter: ModelAreaFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAreas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        description
        costCenter
        campusID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncAreas = /* GraphQL */ `
  query SyncAreas(
    $filter: ModelAreaFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncAreas(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        title
        description
        costCenter
        campusID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const areasByCampusID = /* GraphQL */ `
  query AreasByCampusID(
    $campusID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAreaFilterInput
    $limit: Int
    $nextToken: String
  ) {
    areasByCampusID(
      campusID: $campusID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        title
        description
        costCenter
        campusID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getCampus = /* GraphQL */ `
  query GetCampus($id: ID!) {
    getCampus(id: $id) {
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
export const listCampuses = /* GraphQL */ `
  query ListCampuses(
    $filter: ModelCampusFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCampuses(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncCampuses = /* GraphQL */ `
  query SyncCampuses(
    $filter: ModelCampusFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncCampuses(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        title
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getRole = /* GraphQL */ `
  query GetRole($id: ID!) {
    getRole(id: $id) {
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
export const listRoles = /* GraphQL */ `
  query ListRoles(
    $filter: ModelRoleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRoles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncRoles = /* GraphQL */ `
  query SyncRoles(
    $filter: ModelRoleFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncRoles(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
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
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        email
        name
        roleID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncUsers = /* GraphQL */ `
  query SyncUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUsers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        email
        name
        roleID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const usersByEmail = /* GraphQL */ `
  query UsersByEmail(
    $email: String!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    usersByEmail(
      email: $email
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        email
        name
        roleID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const usersByRoleID = /* GraphQL */ `
  query UsersByRoleID(
    $roleID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    usersByRoleID(
      roleID: $roleID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        email
        name
        roleID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
