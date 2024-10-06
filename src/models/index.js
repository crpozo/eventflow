// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Badge, PaymentLog, EventAttendee, Form, Landing, Attendee, Event, Career, Area, Campus } = initSchema(schema);

export {
  Badge,
  PaymentLog,
  EventAttendee,
  Form,
  Landing,
  Attendee,
  Event,
  Career,
  Area,
  Campus
};