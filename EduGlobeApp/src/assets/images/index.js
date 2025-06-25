import Logo from './EduGlobeLogoGradient.png';
import LogoTransparent from './Logo-transparent.png';
import logout from './logout.png';

import searchIcon from './search-icon.png';
import msgIcon from './msg-icon.png';
import heartIcon from './heart-icon.png';
import reviewIcon from "./review-icon.png";

import dashboardSelected from './dashboard-selected.png';
import discoverSelected from './discover-selected.png';
import forumSelected from './forum-selected.png';
import notificationSelected from './notification-selected.png';
import messageSelected from './message-selected.png';
import profilePlaceholderSelected from './profile-placeholder-selected.png';
import settingsSelected from './settings-selected.png';

import dashboardUnselected from './dashboard-unselected.png';
import discoverUnselected from './discover-unselected.png';
import forumUnselected from './forum-unselected.png';
import notificationUnselected from './notification-unselected.png';
import messageUnselected from './message-unselected.png';
import profilePlaceholderUnselected from './profile-placeholder.png';
import settingsUnselected from './settings-unselected.png';

import filterIcon from './filter.png';

export default {
  Logo,

  LogoTransparent,

  logout,

  icon: {
    searchIcon,
    msgIcon,
    heartIcon,
    filterIcon,
    reviewIcon,
  },

  selected: {
    dashboard: dashboardSelected,
    discover: discoverSelected,
    forum: forumSelected,
    notifications: notificationSelected,
    message: messageSelected,
    profile: profilePlaceholderSelected,
    settings: settingsSelected,
  },

  unselected: {
    dashboard: dashboardUnselected,
    discover: discoverUnselected,
    forum: forumUnselected,
    notifications: notificationUnselected,
    message: messageUnselected,
    profile: profilePlaceholderUnselected,
    settings: settingsUnselected,
  }
};