// Error handling utilities for consistent error management

export interface GameError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
}

export enum ErrorCode {
  // Character errors
  INVALID_CHARACTER = 'INVALID_CHARACTER',
  CHARACTER_NOT_FOUND = 'CHARACTER_NOT_FOUND',
  INVALID_LEVEL = 'INVALID_LEVEL',
  INSUFFICIENT_HEALTH = 'INSUFFICIENT_HEALTH',
  INSUFFICIENT_XP = 'INSUFFICIENT_XP',
  
  // Combat errors
  INVALID_ENEMY = 'INVALID_ENEMY',
  COMBAT_CALCULATION_ERROR = 'COMBAT_CALCULATION_ERROR',
  INVALID_DAMAGE = 'INVALID_DAMAGE',
  
  // Area errors
  INVALID_AREA = 'INVALID_AREA',
  AREA_NOT_UNLOCKED = 'AREA_NOT_UNLOCKED',
  AREA_COMPLETED = 'AREA_COMPLETED',
  
  // Item errors
  INVALID_ITEM = 'INVALID_ITEM',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  INSUFFICIENT_INVENTORY_SPACE = 'INSUFFICIENT_INVENTORY_SPACE',
  ITEM_REQUIREMENTS_NOT_MET = 'ITEM_REQUIREMENTS_NOT_MET',
  
  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  SAVE_FAILED = 'SAVE_FAILED',
  LOAD_FAILED = 'LOAD_FAILED',
  
  // Game logic errors
  INVALID_GAME_STATE = 'INVALID_GAME_STATE',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

// Create a standardized error
export const createError = (
  code: ErrorCode,
  message: string,
  details?: unknown
): GameError => ({
  code,
  message,
  details,
  timestamp: Date.now(),
});

// Log error with consistent format
export const logError = (error: GameError | Error | string): void => {
  if (typeof error === 'string') {
    console.error(`[Game Error] ${error}`);
    return;
  }
  
  if (error instanceof Error) {
    console.error(`[Game Error] ${error.name}: ${error.message}`, error.stack);
    return;
  }
  
  console.error(
    `[Game Error] ${error.code}: ${error.message}`,
    error.details ? { details: error.details, timestamp: error.timestamp } : { timestamp: error.timestamp }
  );
};

// Handle errors with user-friendly messages
export const handleError = (error: GameError | Error | string): string => {
  if (typeof error === 'string') {
    logError(error);
    return error;
  }
  
  if (error instanceof Error) {
    logError(error);
    return 'An unexpected error occurred. Please try again.';
  }
  
  logError(error);
  
  // Return user-friendly messages based on error code
  switch (error.code) {
    case ErrorCode.INVALID_CHARACTER:
      return 'Invalid character data. Please reload the game.';
    case ErrorCode.CHARACTER_NOT_FOUND:
      return 'Character not found. Please select a valid character.';
    case ErrorCode.INSUFFICIENT_HEALTH:
      return 'Not enough health to perform this action.';
    case ErrorCode.INSUFFICIENT_XP:
      return 'Not enough experience to level up.';
    case ErrorCode.INVALID_ENEMY:
      return 'Invalid enemy data. Please reload the area.';
    case ErrorCode.INVALID_AREA:
      return 'Invalid area data. Please return to the world map.';
    case ErrorCode.AREA_NOT_UNLOCKED:
      return 'This area is not yet unlocked.';
    case ErrorCode.AREA_COMPLETED:
      return 'This area has already been completed.';
    case ErrorCode.INVALID_ITEM:
      return 'Invalid item data.';
    case ErrorCode.ITEM_NOT_FOUND:
      return 'Item not found.';
    case ErrorCode.INSUFFICIENT_INVENTORY_SPACE:
      return 'Not enough inventory space.';
    case ErrorCode.ITEM_REQUIREMENTS_NOT_MET:
      return 'You do not meet the requirements for this item.';
    case ErrorCode.STORAGE_ERROR:
      return 'Failed to save/load game data. Please try again.';
    case ErrorCode.SAVE_FAILED:
      return 'Failed to save game. Please try again.';
    case ErrorCode.LOAD_FAILED:
      return 'Failed to load game data. Please refresh the page.';
    case ErrorCode.INVALID_GAME_STATE:
      return 'Invalid game state detected. Please reload the game.';
    case ErrorCode.CALCULATION_ERROR:
      return 'Calculation error occurred. Please try again.';
    case ErrorCode.UNEXPECTED_ERROR:
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

// Wrap async operations with error handling
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  errorCode: ErrorCode,
  errorMessage: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error: unknown) {
    const gameError = createError(errorCode, errorMessage, error);
    logError(gameError);
    return null;
  }
};

// Wrap sync operations with error handling
export const safeSync = <T>(
  operation: () => T,
  errorCode: ErrorCode,
  errorMessage: string
): T | null => {
  try {
    return operation();
  } catch (error: unknown) {
    const gameError = createError(errorCode, errorMessage, error);
    logError(gameError);
    return null;
  }
};

// Validate and handle common game operations
export const validateAndExecute = <T>(
  validation: () => boolean,
  operation: () => T,
  errorCode: ErrorCode,
  errorMessage: string
): T | null => {
  if (!validation()) {
    const gameError = createError(errorCode, errorMessage);
    logError(gameError);
    return null;
  }
  
  return safeSync(operation, errorCode, errorMessage);
};

// Retry mechanism for failed operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        logError(error as Error);
        return null;
      }
      
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
};

// Check if error is recoverable
export const isRecoverableError = (error: GameError): boolean => {
  const recoverableErrors = [
    ErrorCode.STORAGE_ERROR,
    ErrorCode.SAVE_FAILED,
    ErrorCode.LOAD_FAILED,
    ErrorCode.CALCULATION_ERROR,
  ];
  
  return recoverableErrors.includes(error.code as ErrorCode);
};

// Format error for display
export const formatErrorForDisplay = (error: GameError): string => {
  const date = new Date(error.timestamp).toLocaleString();
  return `[${date}] ${error.code}: ${error.message}`;
}; 