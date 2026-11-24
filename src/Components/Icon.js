import React from 'react';
import {
  ArrowRight,
  Bell,
  Bridge,
  Building,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LocateFixed,
  CircleCheck,
  CircleHelp,
  Clock3,
  Construction,
  Droplet,
  Droplets,
  Globe,
  House,
  Layers3,
  Landmark,
  Lamp,
  Lightbulb,
  List,
  LogOut,
  MapPin,
  Moon,
  Road,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Trash,
  Trees,
  Toilet,
  UtilityPole,
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
  bridge: Bridge,
  construction: Construction,
  building: Building,
  streetlight: Lamp,
  sanitation: Trash2,
  trash: Trash,
  electricity: Lightbulb,
  water: Droplet,
  waterSupply: Droplets,
  drainage: Waves,
  sewerage: Toilet,
  utilityPole: UtilityPole,
  parks: Trees,
  trees: Trees,
  waves: Waves,
  bell: Bell,
  phone: Smartphone,
  language: Globe,
  moon: Moon,
  logout: LogOut,
  camera: Camera,
  location: MapPin,
  locate: LocateFixed,
  refresh: RefreshCw,
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
