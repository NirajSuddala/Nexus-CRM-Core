import sequelize from '../config/database';
import User from './User';
import Company from './Company';
import Contact from './Contact';
import Deal from './Deal';
import Task from './Task';
import Activity from './Activity';
import Note from './Note';

// Company - Contact relationship (One-to-Many)
Company.hasMany(Contact, {
  foreignKey: 'companyId',
  as: 'contacts',
});
Contact.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// Company - Deal relationship (One-to-Many)
Company.hasMany(Deal, {
  foreignKey: 'companyId',
  as: 'deals',
});
Deal.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// Contact - Deal relationship (One-to-Many)
Contact.hasMany(Deal, {
  foreignKey: 'contactId',
  as: 'deals',
});
Deal.belongsTo(Contact, {
  foreignKey: 'contactId',
  as: 'contact',
});

// Contact - Task relationship (One-to-Many)
Contact.hasMany(Task, {
  foreignKey: 'contactId',
  as: 'tasks',
});
Task.belongsTo(Contact, {
  foreignKey: 'contactId',
  as: 'contact',
});

// Deal - Task relationship (One-to-Many)
Deal.hasMany(Task, {
  foreignKey: 'dealId',
  as: 'tasks',
});
Task.belongsTo(Deal, {
  foreignKey: 'dealId',
  as: 'deal',
});

// User - Task relationship (One-to-Many)
User.hasMany(Task, {
  foreignKey: 'assignedTo',
  as: 'tasks',
});
Task.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee',
});

// User - Activity relationship (One-to-Many)
User.hasMany(Activity, {
  foreignKey: 'userId',
  as: 'activities',
});
Activity.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User - Note relationship (One-to-Many)
User.hasMany(Note, {
  foreignKey: 'userId',
  as: 'notes',
});
Note.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export {
  sequelize,
  User,
  Company,
  Contact,
  Deal,
  Task,
  Activity,
  Note,
};
