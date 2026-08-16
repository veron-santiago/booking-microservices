package com.club_service.persistence;

public enum ExceptionType {
    /** The club is fully closed on that date, overriding the weekly schedule. */
    CLOSED,
    /** The club uses the given intervals on that date, overriding the weekly schedule. */
    CUSTOM_HOURS
}
