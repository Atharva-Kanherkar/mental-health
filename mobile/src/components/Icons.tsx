/**
 * Icon Components
 * Consistent icon components using @expo/vector-icons
 * NO emoji text - only vector icons
 */

import React from 'react';
import { Ionicons, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../config/theme';

interface IconProps {
  size?: number;
  color?: string;
}

// Navigation & UI Icons
export const HomeIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="home" size={size} color={color} />
);

export const HeartIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="heart" size={size} color={color} />
);

export const BookIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="book" size={size} color={color} />
);

export const PersonIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="person" size={size} color={color} />
);

export const PeopleIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="people" size={size} color={color} />
);

export const SettingsIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="settings" size={size} color={color} />
);

export const LogoutIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="log-out" size={size} color={color} />
);

// Action Icons
export const PlusIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="add" size={size} color={color} />
);

export const CheckIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="checkmark" size={size} color={color} />
);

export const CloseIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="close" size={size} color={color} />
);

export const EditIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Feather name="edit" size={size} color={color} />
);

export const DeleteIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="trash" size={size} color={color} />
);

export const SaveIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="save" size={size} color={color} />
);

export const ArrowBackIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="arrow-back" size={size} color={color} />
);

export const ArrowForwardIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="arrow-forward" size={size} color={color} />
);

export const SearchIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="search" size={size} color={color} />
);

export const FilterIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="filter" size={size} color={color} />
);

export const MoreIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="ellipsis-horizontal" size={size} color={color} />
);

export const ShareIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="share-social" size={size} color={color} />
);

// Mental Health & Wellness Icons
export const BrainIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <MaterialCommunityIcons name="brain" size={size} color={color} />
);

export const MeditateIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <MaterialCommunityIcons name="meditation" size={size} color={color} />
);

export const EmotionIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <MaterialCommunityIcons name="emoticon-happy-outline" size={size} color={color} />
);

export const SadEmotionIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <MaterialCommunityIcons name="emoticon-sad-outline" size={size} color={color} />
);

export const ChecklistIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <MaterialIcons name="checklist" size={size} color={color} />
);

export const ClipboardIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="clipboard" size={size} color={color} />
);

// Memory & Media Icons
export const ImageIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="image" size={size} color={color} />
);

export const CameraIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="camera" size={size} color={color} />
);

export const MicIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="mic" size={size} color={color} />
);

export const VideoIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="videocam" size={size} color={color} />
);

export const DocumentIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="document-text" size={size} color={color} />
);

export const FolderIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="folder" size={size} color={color} />
);

export const StarIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="star" size={size} color={color} />
);

export const StarOutlineIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="star-outline" size={size} color={color} />
);

// Gamification Icons
export const TrophyIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="trophy" size={size} color={color} />
);

export const MedalIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="medal" size={size} color={color} />
);

export const RibbonIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="ribbon" size={size} color={color} />
);

export const FlameIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="flame" size={size} color={color} />
);

export const SparklesIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="sparkles" size={size} color={color} />
);

// Activity Icons
export const CalendarIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="calendar" size={size} color={color} />
);

export const TimeIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="time" size={size} color={color} />
);

export const TrendingUpIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="trending-up" size={size} color={color} />
);

export const TrendingDownIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="trending-down" size={size} color={color} />
);

export const StatsIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="stats-chart" size={size} color={color} />
);

export const BarChartIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="bar-chart" size={size} color={color} />
);

// Health Icons
export const FitnessIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="fitness" size={size} color={color} />
);

export const BedIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="bed" size={size} color={color} />
);

export const RestaurantIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="restaurant" size={size} color={color} />
);

export const MedicalIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="medical" size={size} color={color} />
);

export const PillIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <MaterialCommunityIcons name="pill" size={size} color={color} />
);

export const WalkIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="walk" size={size} color={color} />
);

// Alert & Warning Icons
export const WarningIcon = ({ size = 24, color = theme.colors.warning }: IconProps) => (
  <Ionicons name="warning" size={size} color={color} />
);

export const AlertIcon = ({ size = 24, color = theme.colors.error }: IconProps) => (
  <Ionicons name="alert-circle" size={size} color={color} />
);

export const InfoIcon = ({ size = 24, color = theme.colors.info }: IconProps) => (
  <Ionicons name="information-circle" size={size} color={color} />
);

export const ShieldIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="shield-checkmark" size={size} color={color} />
);

export const LockIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="lock-closed" size={size} color={color} />
);

export const UnlockIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="lock-open" size={size} color={color} />
);

// Communication Icons
export const CallIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="call" size={size} color={color} />
);

export const MailIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="mail" size={size} color={color} />
);

export const ChatIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="chatbubbles" size={size} color={color} />
);

export const NotificationsIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="notifications" size={size} color={color} />
);

// Mood Icons (different colors)
export const HappyIcon = ({ size = 24, color = theme.colors.mood.excellent }: IconProps) => (
  <MaterialCommunityIcons name="emoticon-happy-outline" size={size} color={color} />
);

export const NeutralIcon = ({ size = 24, color = theme.colors.mood.okay }: IconProps) => (
  <MaterialCommunityIcons name="emoticon-neutral-outline" size={size} color={color} />
);

export const SadIcon = ({ size = 24, color = theme.colors.mood.struggling }: IconProps) => (
  <MaterialCommunityIcons name="emoticon-sad-outline" size={size} color={color} />
);

export const VerySadIcon = ({ size = 24, color = theme.colors.mood.difficult }: IconProps) => (
  <MaterialCommunityIcons name="emoticon-cry-outline" size={size} color={color} />
);

// Utility Icons
export const RefreshIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="refresh" size={size} color={color} />
);

export const DownloadIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="download" size={size} color={color} />
);

export const UploadIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="cloud-upload" size={size} color={color} />
);

export const EyeIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="eye" size={size} color={color} />
);

export const EyeOffIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="eye-off" size={size} color={color} />
);

export const PlayIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="play" size={size} color={color} />
);

export const PauseIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="pause" size={size} color={color} />
);

export const StopIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="stop" size={size} color={color} />
);

// Location & Navigation
export const LocationIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="location" size={size} color={color} />
);

export const NavigateIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="navigate" size={size} color={color} />
);

export const CompassIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="compass" size={size} color={color} />
);

// Magic/AI Icons
export const MagicIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <MaterialCommunityIcons name="auto-fix" size={size} color={color} />
);

export const AIIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <MaterialCommunityIcons name="robot" size={size} color={color} />
);

export const LightbulbIcon = ({ size = 24, color = theme.colors.primary }: IconProps) => (
  <Ionicons name="bulb" size={size} color={color} />
);
