// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Badge, PaymentLog, EventAttendee, Form, Survey, SurveyResponse, Landing, Attendee, Event, Career, Area, Campus, Role, User, EventPermission } = initSchema(schema);

export {
  Badge,
  PaymentLog,
  EventAttendee,
  Form,
  Survey,
  SurveyResponse,
  Landing,
  Attendee,
  Event,
  Career,
  Area,
  Campus,
  Role,
  User,
  EventPermission
};