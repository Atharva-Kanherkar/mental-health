export interface CrisisAlert {
  type: 'CRISIS_ALERT';
  userName: string;
  crisisLevel: 'moderate' | 'high' | 'critical';
  timestamp: string;
  userId: string;
  userPhone?: string;
}

export interface DeviceRegistration {
  phoneNumber: string;
  deviceToken: string;
  platform: 'ios' | 'android';
  personName: string;
}

export interface LinkStatus {
  isLinked: boolean;
  phoneNumber?: string;
  personName?: string;
  linkedUserName?: string;
}

export type RootStackParamList = {
  Link: undefined;
  Active: {
    phoneNumber: string;
    personName: string;
  };
  Alert: CrisisAlert;
};
