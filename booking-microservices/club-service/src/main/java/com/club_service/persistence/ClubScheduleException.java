package com.club_service.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * A date-specific override of the club's weekly schedule.
 * CLOSED      -> the club is closed that date.
 * CUSTOM_HOURS -> the club uses {@link #intervals} that date.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubScheduleException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private ExceptionType type;

    private String note;

    @ElementCollection
    @CollectionTable(
            name = "club_exception_intervals",
            joinColumns = @JoinColumn(name = "exception_id")
    )
    @Builder.Default
    private List<TimeInterval> intervals = new ArrayList<>();
}
