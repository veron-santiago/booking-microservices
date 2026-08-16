package com.sportsfacility_service.persistence;

public enum ExceptionType {
    /** The facility is fully closed on that date, overriding its weekly schedule. */
    CLOSED,
    /** The facility uses the given intervals on that date, overriding its weekly schedule. */
    CUSTOM_HOURS,
    /** The given intervals are removed from the facility's normal availability that date. */
    BLOCKED
}
