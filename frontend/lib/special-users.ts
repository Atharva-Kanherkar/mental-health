/**
 * Utility functions for special user experiences
 */

/**
 * Checks if the user is Diyana (case-insensitive)
 */
export function isDiyana(user: { name?: string | null; username?: string | null; email?: string | null }): boolean {
  if (!user) return false;
  
  const checkString = (str: string | null | undefined): boolean => {
    if (!str) return false;
    return str.toLowerCase().includes('diyana');
  };

  // Check name, username, or email for "diyana"
  return checkString(user.name) || checkString(user.username) || checkString(user.email);
}

/**
 * Checks if any of the added people during onboarding contains "diyana"
 */
export function hasDiyanaInPeople(people: Array<{ name: string }>): boolean {
  return people.some(person => 
    person.name.toLowerCase().includes('diyana')
  );
}

/**
 * Get special message for Diyana
 */
export function getDiyanaSpecialMessage(): string {
  return "Welcome to your sanctuary, my love 💕✨";
}
