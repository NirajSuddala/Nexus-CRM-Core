import sequelize from '../config/database';
import User from './User';
import Company from './Company';
import Contact from './Contact';
import Pipeline from './Pipeline';
import PipelineStage from './PipelineStage';
import Deal from './Deal';
import Task from './Task';
import Activity from './Activity';
import EmailTemplate from './EmailTemplate';
import Email from './Email';
import Survey from './Survey';
import SurveyResponse from './SurveyResponse';
import Automation from './Automation';
import HealthScore from './HealthScore';
import Project from './Project';
import Milestone from './Milestone';
import Ticket from './Ticket';
import EmailSequence from './EmailSequence';
import EmailSequenceStep from './EmailSequenceStep';

// =====================
// User Associations
// =====================

// User - Company (Many-to-One)
User.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});
Company.hasMany(User, {
  foreignKey: 'companyId',
  as: 'users',
});

// User - Task (assigned_to)
User.hasMany(Task, {
  foreignKey: 'assignedTo',
  as: 'assignedTasks',
});
Task.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee',
});

// User - Task (created_by)
User.hasMany(Task, {
  foreignKey: 'createdBy',
  as: 'createdTasks',
});
Task.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// User - Activity (created_by)
User.hasMany(Activity, {
  foreignKey: 'createdBy',
  as: 'activities',
});
Activity.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// User - EmailTemplate (created_by)
User.hasMany(EmailTemplate, {
  foreignKey: 'createdBy',
  as: 'emailTemplates',
});
EmailTemplate.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// User - Email (sent_by)
User.hasMany(Email, {
  foreignKey: 'sentBy',
  as: 'sentEmails',
});
Email.belongsTo(User, {
  foreignKey: 'sentBy',
  as: 'sender',
});

// User - Survey (created_by)
User.hasMany(Survey, {
  foreignKey: 'createdBy',
  as: 'surveys',
});
Survey.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// User - Automation (created_by)
User.hasMany(Automation, {
  foreignKey: 'createdBy',
  as: 'automations',
});
Automation.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// =====================
// Company Associations
// =====================

// Company - Contact
Company.hasMany(Contact, {
  foreignKey: 'companyId',
  as: 'contacts',
});
Contact.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// Company - Deal
Company.hasMany(Deal, {
  foreignKey: 'companyId',
  as: 'deals',
});
Deal.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// Company - Pipeline
Company.hasMany(Pipeline, {
  foreignKey: 'companyId',
  as: 'pipelines',
});
Pipeline.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// Company - Activity
Company.hasMany(Activity, {
  foreignKey: 'companyId',
  as: 'activities',
});
Activity.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// Company - SurveyResponse
Company.hasMany(SurveyResponse, {
  foreignKey: 'companyId',
  as: 'surveyResponses',
});
SurveyResponse.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// Company - HealthScore
Company.hasMany(HealthScore, {
  foreignKey: 'companyId',
  as: 'healthScores',
});
HealthScore.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// =====================
// Contact Associations
// =====================

// Contact - Deal
Contact.hasMany(Deal, {
  foreignKey: 'contactId',
  as: 'deals',
});
Deal.belongsTo(Contact, {
  foreignKey: 'contactId',
  as: 'contact',
});

// Contact - Task
Contact.hasMany(Task, {
  foreignKey: 'contactId',
  as: 'tasks',
});
Task.belongsTo(Contact, {
  foreignKey: 'contactId',
  as: 'contact',
});

// Contact - Activity
Contact.hasMany(Activity, {
  foreignKey: 'contactId',
  as: 'activities',
});
Activity.belongsTo(Contact, {
  foreignKey: 'contactId',
  as: 'contact',
});

// Contact - Email
Contact.hasMany(Email, {
  foreignKey: 'contactId',
  as: 'emails',
});
Email.belongsTo(Contact, {
  foreignKey: 'contactId',
  as: 'contact',
});

// Contact - SurveyResponse
Contact.hasMany(SurveyResponse, {
  foreignKey: 'contactId',
  as: 'surveyResponses',
});
SurveyResponse.belongsTo(Contact, {
  foreignKey: 'contactId',
  as: 'contact',
});

// Contact - HealthScore
Contact.hasMany(HealthScore, {
  foreignKey: 'contactId',
  as: 'healthScores',
});
HealthScore.belongsTo(Contact, {
  foreignKey: 'contactId',
  as: 'contact',
});

// =====================
// Pipeline Associations
// =====================

// Pipeline - PipelineStage
Pipeline.hasMany(PipelineStage, {
  foreignKey: 'pipelineId',
  as: 'stages',
});
PipelineStage.belongsTo(Pipeline, {
  foreignKey: 'pipelineId',
  as: 'pipeline',
});

// Pipeline - Deal
Pipeline.hasMany(Deal, {
  foreignKey: 'pipelineId',
  as: 'deals',
});
Deal.belongsTo(Pipeline, {
  foreignKey: 'pipelineId',
  as: 'pipeline',
});

// PipelineStage - Deal
PipelineStage.hasMany(Deal, {
  foreignKey: 'stageId',
  as: 'deals',
});
Deal.belongsTo(PipelineStage, {
  foreignKey: 'stageId',
  as: 'stage',
});

// =====================
// Deal Associations
// =====================

// Deal - Task
Deal.hasMany(Task, {
  foreignKey: 'dealId',
  as: 'tasks',
});
Task.belongsTo(Deal, {
  foreignKey: 'dealId',
  as: 'deal',
});

// Deal - Activity
Deal.hasMany(Activity, {
  foreignKey: 'dealId',
  as: 'activities',
});
Activity.belongsTo(Deal, {
  foreignKey: 'dealId',
  as: 'deal',
});

// Deal - Email
Deal.hasMany(Email, {
  foreignKey: 'dealId',
  as: 'emails',
});
Email.belongsTo(Deal, {
  foreignKey: 'dealId',
  as: 'deal',
});

// =====================
// Task Associations
// =====================

// Task - Activity
Task.hasMany(Activity, {
  foreignKey: 'taskId',
  as: 'activities',
});
Activity.belongsTo(Task, {
  foreignKey: 'taskId',
  as: 'task',
});

// =====================
// Email Associations
// =====================

// EmailTemplate - Email
EmailTemplate.hasMany(Email, {
  foreignKey: 'templateId',
  as: 'emails',
});
Email.belongsTo(EmailTemplate, {
  foreignKey: 'templateId',
  as: 'template',
});

// Email - Activity
Email.hasMany(Activity, {
  foreignKey: 'emailId',
  as: 'activities',
});
Activity.belongsTo(Email, {
  foreignKey: 'emailId',
  as: 'email',
});

// =====================
// Survey Associations
// =====================

// Survey - SurveyResponse
Survey.hasMany(SurveyResponse, {
  foreignKey: 'surveyId',
  as: 'responses',
});
SurveyResponse.belongsTo(Survey, {
  foreignKey: 'surveyId',
  as: 'survey',
});

// =====================
// Project Associations
// =====================

// Company - Project
Company.hasMany(Project, {
  foreignKey: 'companyId',
  as: 'projects',
});
Project.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// Contact - Project
Contact.hasMany(Project, {
  foreignKey: 'contactId',
  as: 'projects',
});
Project.belongsTo(Contact, {
  foreignKey: 'contactId',
  as: 'contact',
});

// Deal - Project
Deal.hasMany(Project, {
  foreignKey: 'dealId',
  as: 'projects',
});
Project.belongsTo(Deal, {
  foreignKey: 'dealId',
  as: 'deal',
});

// Pipeline - Project
Pipeline.hasMany(Project, {
  foreignKey: 'pipelineId',
  as: 'projects',
});
Project.belongsTo(Pipeline, {
  foreignKey: 'pipelineId',
  as: 'pipeline',
});

// PipelineStage - Project
PipelineStage.hasMany(Project, {
  foreignKey: 'stageId',
  as: 'projects',
});
Project.belongsTo(PipelineStage, {
  foreignKey: 'stageId',
  as: 'stage',
});

// User - Project (owner)
User.hasMany(Project, {
  foreignKey: 'ownerId',
  as: 'ownedProjects',
});
Project.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner',
});

// =====================
// Milestone Associations
// =====================

// Project - Milestone
Project.hasMany(Milestone, {
  foreignKey: 'projectId',
  as: 'milestones',
});
Milestone.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// =====================
// Ticket Associations
// =====================

// Company - Ticket
Company.hasMany(Ticket, {
  foreignKey: 'companyId',
  as: 'tickets',
});
Ticket.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// Contact - Ticket
Contact.hasMany(Ticket, {
  foreignKey: 'contactId',
  as: 'tickets',
});
Ticket.belongsTo(Contact, {
  foreignKey: 'contactId',
  as: 'contact',
});

// Project - Ticket
Project.hasMany(Ticket, {
  foreignKey: 'projectId',
  as: 'tickets',
});
Ticket.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// User - Ticket (assignedTo)
User.hasMany(Ticket, {
  foreignKey: 'assignedTo',
  as: 'assignedTickets',
});
Ticket.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee',
});

// User - Ticket (createdBy)
User.hasMany(Ticket, {
  foreignKey: 'createdBy',
  as: 'createdTickets',
});
Ticket.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// =====================
// Email Sequence Associations
// =====================

// Company - EmailSequence
Company.hasMany(EmailSequence, {
  foreignKey: 'companyId',
  as: 'emailSequences',
});
EmailSequence.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// User - EmailSequence (createdBy)
User.hasMany(EmailSequence, {
  foreignKey: 'createdBy',
  as: 'emailSequences',
});
EmailSequence.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// EmailSequence - EmailSequenceStep
EmailSequence.hasMany(EmailSequenceStep, {
  foreignKey: 'sequenceId',
  as: 'steps',
});
EmailSequenceStep.belongsTo(EmailSequence, {
  foreignKey: 'sequenceId',
  as: 'sequence',
});

// EmailTemplate - EmailSequenceStep
EmailTemplate.hasMany(EmailSequenceStep, {
  foreignKey: 'templateId',
  as: 'sequenceSteps',
});
EmailSequenceStep.belongsTo(EmailTemplate, {
  foreignKey: 'templateId',
  as: 'template',
});

export {
  sequelize,
  User,
  Company,
  Contact,
  Pipeline,
  PipelineStage,
  Deal,
  Task,
  Activity,
  EmailTemplate,
  Email,
  Survey,
  SurveyResponse,
  Automation,
  HealthScore,
  Project,
  Milestone,
  Ticket,
  EmailSequence,
  EmailSequenceStep,
};
