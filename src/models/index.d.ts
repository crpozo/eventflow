import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncItem, AsyncCollection } from "@aws-amplify/datastore";





type EagerEventAttendee = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EventAttendee, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly eventID: string;
  readonly attendeeID: string;
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
  readonly title?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyLanding = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Landing, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
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
  readonly name?: string | null;
  readonly authorized?: boolean | null;
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
  readonly name?: string | null;
  readonly authorized?: boolean | null;
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
  readonly title?: string | null;
  readonly description?: string | null;
  readonly Landing?: Landing | null;
  readonly careerID: string;
  readonly EventAttendees?: (EventAttendee | null)[] | null;
  readonly Form?: Form | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly eventLandingId?: string | null;
  readonly eventFormId?: string | null;
}

type LazyEvent = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Event, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly Landing: AsyncItem<Landing | undefined>;
  readonly careerID: string;
  readonly EventAttendees: AsyncCollection<EventAttendee>;
  readonly Form: AsyncItem<Form | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly eventLandingId?: string | null;
  readonly eventFormId?: string | null;
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
  readonly areaID: string;
  readonly Events?: (Event | null)[] | null;
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
  readonly areaID: string;
  readonly Events: AsyncCollection<Event>;
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
  readonly campusID: string;
  readonly Carreras?: (Career | null)[] | null;
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
  readonly campusID: string;
  readonly Carreras: AsyncCollection<Career>;
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
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Campus = LazyLoading extends LazyLoadingDisabled ? EagerCampus : LazyCampus

export declare const Campus: (new (init: ModelInit<Campus>) => Campus) & {
  copyOf(source: Campus, mutator: (draft: MutableModel<Campus>) => MutableModel<Campus> | void): Campus;
}