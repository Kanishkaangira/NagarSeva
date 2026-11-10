import React from 'react';
import {
  ArrowRight,
  Bell,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleHelp,
  Clock3,
  Droplet,
  Globe,
  House,
  Layers3,
  Landmark,
  Lightbulb,
  List,
  LogOut,
  MapPin,
  Road,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  Trees,
  UserRound,
  Waves,
} from 'lucide-react-native';
import { colors } from '../Theme';

const iconSet = {
  home: House,
  all: Layers3,
  open: Clock3,
  resolved: CircleCheck,
  landmark: Landmark,
  reports: List,
  profile: UserRound,
  roads: Road,
  sanitation: Trash2,
  electricity: Lightbulb,
  water: Droplet,
  drainage: Waves,
  parks: Trees,
  trees: Trees,
  waves: Waves,
  bell: Bell,
  phone: Smartphone,
  language: Globe,
  logout: LogOut,
  camera: Camera,
  location: MapPin,
  shield: ShieldCheck,
  arrowRight: ArrowRight,
  arrowLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  check: Check,
  plus: Plus,
  help: CircleHelp,
};

export default function Icon({
  name,
  color = colors.blue,
  size = 20,
  strokeWidth = 2,
}) {
  const IconComponent = iconSet[name];
  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth
    />
  );
}
