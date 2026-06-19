import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection, AsyncItem } from "@aws-amplify/datastore";





type EagerBadge = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Badge, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly frontDesign?: string | null;
  readonly backDesign?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyBadge = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Badge, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly frontDesign?: string | null;
  readonly backDesign?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Badge = LazyLoading extends LazyLoadingDisabled ? EagerBadge : LazyBadge

export declare const Badge: (new (init: ModelInit<Badge>) => Badge) & {
  copyOf(source: Badge, mutator: (draft: MutableModel<Badge>) => MutableModel<Badge> | void): Badge;
}

type EagerPaymentLog = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<PaymentLog, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly eventattendeeID: string;
  readonly status?: string | null;
  readonly type?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyPaymentLog = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<PaymentLog, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly eventattendeeID: string;
  readonly status?: string | null;
  readonly type?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type PaymentLog = LazyLoading extends LazyLoadingDisabled ? EagerPaymentLog : LazyPaymentLog

export declare const PaymentLog: (new (init: ModelInit<PaymentLog>) => PaymentLog) & {
  copyOf(source: PaymentLog, mutator: (draft: MutableModel<PaymentLog>) => MutableModel<PaymentLog> | void): PaymentLog;
}

type EagerEventAttendee = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EventAttendee, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly eventID: string;
  readonly attendeeID: string;
  readonly email: string;
  readonly authorized?: boolean | null;
  readonly checkIn?: boolean | null;
  readonly formAnswers?: string | null;
  readonly ticket?: string | null;
  readonly allowContact?: boolean | null;
  readonly quantity?: number | null;
  readonly scanned?: number | null;
  readonly profileURL?: string | null;
  readonly PaymentLogs?: (PaymentLog | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyEventAttendee = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EventAttendee, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly eventID: string;
  readonly attendeeID: string;
  readonly email: string;
  readonly authorized?: boolean | null;
  readonly checkIn?: boolean | null;
  readonly formAnswers?: string | null;
  readonly ticket?: string | null;
  readonly allowContact?: boolean | null;
  readonly quantity?: number | null;
  readonly scanned?: number | null;
  readonly profileURL?: string | null;
  readonly PaymentLogs: AsyncCollection<PaymentLog>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type EventAttendee = LazyLoading extends LazyLoadingDisabled ? EagerEventAttendee : LazyEventAttendee

export declare const EventAttendee: (new (init: ModelInit<EventAttendee>) => EventAttendee) & {
  copyOf(source: EventAttendee, mutator: (draft: MutableModel<EventAttendee>) => MutableModel<EventAttendee> | void): EventAttendee;
}

type EagerForm = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Form, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly questions?: string | null;
  readonly Event?: Event | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly formEventId?: string | null;
}

type LazyForm = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Form, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly questions?: string | null;
  readonly Event: AsyncItem<Event | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly formEventId?: string | null;
}

export declare type Form = LazyLoading extends LazyLoadingDisabled ? EagerForm : LazyForm

export declare const Form: (new (init: ModelInit<Form>) => Form) & {
  copyOf(source: Form, mutator: (draft: MutableModel<Form>) => MutableModel<Form> | void): Form;
}

type EagerLanding = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Landing, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly active?: boolean | null;
  readonly Event?: Event | null;
  readonly title: string;
  readonly description: string;
  readonly mainBanner?: string | null;
  readonly location: string;
  readonly cost?: string | null;
  readonly ticketTitle?: (string | null)[] | null;
  readonly ticketPrice?: (number | null)[] | null;
  readonly extraInfo?: string | null;
  readonly userConsentCheck?: string | null;
  readonly metaScripts?: string | null;
  readonly galleryPhotos?: (string | null)[] | null;
  readonly partnerLogos?: (string | null)[] | null;
  readonly customHtml?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly landingEventId?: string | null;
}

type LazyLanding = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Landing, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly active?: boolean | null;
  readonly Event: AsyncItem<Event | undefined>;
  readonly title: string;
  readonly description: string;
  readonly mainBanner?: string | null;
  readonly location: string;
  readonly cost?: string | null;
  readonly ticketTitle?: (string | null)[] | null;
  readonly ticketPrice?: (number | null)[] | null;
  readonly extraInfo?: string | null;
  readonly userConsentCheck?: string | null;
  readonly metaScripts?: string | null;
  readonly galleryPhotos?: (string | null)[] | null;
  readonly partnerLogos?: (string | null)[] | null;
  readonly customHtml?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly landingEventId?: string | null;
}

export declare type Landing = LazyLoading extends LazyLoadingDisabled ? EagerLanding : LazyLanding

export declare const Landing: (new (init: ModelInit<Landing>) => Landing) & {
  copyOf(source: Landing, mutator: (draft: MutableModel<Landing>) => MutableModel<Landing> | void): Landing;
}

type EagerAttendee = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Attendee, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly EventAttendees?: (EventAttendee | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyAttendee = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Attendee, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly EventAttendees: AsyncCollection<EventAttendee>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Attendee = LazyLoading extends LazyLoadingDisabled ? EagerAttendee : LazyAttendee

export declare const Attendee: (new (init: ModelInit<Attendee>) => Attendee) & {
  copyOf(source: Attendee, mutator: (draft: MutableModel<Attendee>) => MutableModel<Attendee> | void): Attendee;
}

type EagerEvent = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Event, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly Landing?: Landing | null;
  readonly careerID: string;
  readonly Form?: Form | null;
  readonly EventAttendees?: (EventAttendee | null)[] | null;
  readonly category?: string | null;
  readonly location?: string | null;
  readonly date?: string | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly sendCertificates?: boolean | null;
  readonly certificate?: string | null;
  readonly certificatePosition?: string | null;
  readonly certificatesSentAt?: string | null;
  readonly contactTemplate?: string | null;
  readonly termsCondition: string;
  readonly totalScannedTicket?: number | null;
  readonly maxRegs?: number | null;
  readonly eventIdUSFQ?: string | null;
  readonly periodoUSFQ?: string | null;
  readonly usuarioUSFQ?: string | null;
  readonly Badge?: Badge | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly eventLandingId?: string | null;
  readonly eventFormId?: string | null;
  readonly eventBadgeId?: string | null;
}

type LazyEvent = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Event, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly Landing: AsyncItem<Landing | undefined>;
  readonly careerID: string;
  readonly Form: AsyncItem<Form | undefined>;
  readonly EventAttendees: AsyncCollection<EventAttendee>;
  readonly category?: string | null;
  readonly location?: string | null;
  readonly date?: string | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly sendCertificates?: boolean | null;
  readonly certificate?: string | null;
  readonly certificatePosition?: string | null;
  readonly certificatesSentAt?: string | null;
  readonly contactTemplate?: string | null;
  readonly termsCondition: string;
  readonly totalScannedTicket?: number | null;
  readonly maxRegs?: number | null;
  readonly eventIdUSFQ?: string | null;
  readonly periodoUSFQ?: string | null;
  readonly usuarioUSFQ?: string | null;
  readonly Badge: AsyncItem<Badge | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly eventLandingId?: string | null;
  readonly eventFormId?: string | null;
  readonly eventBadgeId?: string | null;
}

export declare type Event = LazyLoading extends LazyLoadingDisabled ? EagerEvent : LazyEvent

export declare const Event: (new (init: ModelInit<Event>) => Event) & {
  copyOf(source: Event, mutator: (draft: MutableModel<Event>) => MutableModel<Event> | void): Event;
}

type EagerCareer = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Career, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly Events?: (Event | null)[] | null;
  readonly costCenter?: string | null;
  readonly areaID: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyCareer = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Career, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly Events: AsyncCollection<Event>;
  readonly costCenter?: string | null;
  readonly areaID: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Career = LazyLoading extends LazyLoadingDisabled ? EagerCareer : LazyCareer

export declare const Career: (new (init: ModelInit<Career>) => Career) & {
  copyOf(source: Career, mutator: (draft: MutableModel<Career>) => MutableModel<Career> | void): Career;
}

type EagerArea = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Area, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly Carreras?: (Career | null)[] | null;
  readonly costCenter?: string | null;
  readonly campusID: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyArea = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Area, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly Carreras: AsyncCollection<Career>;
  readonly costCenter?: string | null;
  readonly campusID: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Area = LazyLoading extends LazyLoadingDisabled ? EagerArea : LazyArea

export declare const Area: (new (init: ModelInit<Area>) => Area) & {
  copyOf(source: Area, mutator: (draft: MutableModel<Area>) => MutableModel<Area> | void): Area;
}

type EagerCampus = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Campus, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly CampusArea?: (Area | null)[] | null;
  readonly description?: string | null;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyCampus = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Campus, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly CampusArea: AsyncCollection<Area>;
  readonly description?: string | null;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Campus = LazyLoading extends LazyLoadingDisabled ? EagerCampus : LazyCampus

export declare const Campus: (new (init: ModelInit<Campus>) => Campus) & {
  copyOf(source: Campus, mutator: (draft: MutableModel<Campus>) => MutableModel<Campus> | void): Campus;
}

type EagerRole = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Role, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name: string;
  readonly areas?: (string | null)[] | null;
  readonly users?: (User | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyRole = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Role, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name: string;
  readonly areas?: (string | null)[] | null;
  readonly users: AsyncCollection<User>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Role = LazyLoading extends LazyLoadingDisabled ? EagerRole : LazyRole

export declare const Role: (new (init: ModelInit<Role>) => Role) & {
  copyOf(source: Role, mutator: (draft: MutableModel<Role>) => MutableModel<Role> | void): Role;
}

type EagerUser = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<User, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly email: string;
  readonly name?: string | null;
  readonly roleID: string;
  readonly role?: Role | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUser = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<User, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly email: string;
  readonly name?: string | null;
  readonly roleID: string;
  readonly role: AsyncItem<Role | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type User = LazyLoading extends LazyLoadingDisabled ? EagerUser : LazyUser

export declare const User: (new (init: ModelInit<User>) => User) & {
  copyOf(source: User, mutator: (draft: MutableModel<User>) => MutableModel<User> | void): User;
}
type EagerEventPermission = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EventPermission, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userID: string;
  readonly eventID: string;
  readonly capabilities?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyEventPermission = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EventPermission, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userID: string;
  readonly eventID: string;
  readonly capabilities?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type EventPermission = LazyLoading extends LazyLoadingDisabled ? EagerEventPermission : LazyEventPermission

export declare const EventPermission: (new (init: ModelInit<EventPermission>) => EventPermission) & {
  copyOf(source: EventPermission, mutator: (draft: MutableModel<EventPermission>) => MutableModel<EventPermission> | void): EventPermission;
}
