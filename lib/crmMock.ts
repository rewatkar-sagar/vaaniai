// lib/crmMock.ts

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "enterprise";
  pastIssues: number;
  lastInteraction: string;
}

export function getMockCRMUser(): CRMUser {
  return {
    id: "user_123",
    name: "John Doe",
    email: "john@example.com",
    plan: "pro",
    pastIssues: 2,
    lastInteraction: "2024-12-15",
  };
}