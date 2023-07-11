import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection } from "@aws-amplify/datastore";





type EagerArea = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Area, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
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