import React from 'react';

const Icon = (props) => <svg data-testid="icon" {...props} />;

export const Home = Icon;
export const Users = Icon;
export const Briefcase = Icon;
export const Bell = Icon;
export const UserCircle = Icon;
export const LogOut = Icon;
export const Menu = Icon;
export const X = Icon;
export const DollarSign = Icon;
export const ShieldCheck = Icon;
export const MessageSquare = Icon;
export const Headphones = Icon;
export const LayoutDashboard = Icon;
export const FileText = Icon;
export const BarChart2 = Icon;
export const CalendarDays = Icon;
export const Settings = Icon;
export const ChevronDown = Icon;
export const ChevronRight = Icon;
export const UploadCloud = Icon;
export const ClipboardList = Icon;
export const Search = Icon;
export const CreditCard = Icon;

export default new Proxy({}, { get: () => Icon });
