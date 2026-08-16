package com.club_service.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;

    /** Recurring weekly opening intervals. Several rows may share a day of week. */
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "club_id")
    private List<ClubOpeningHours> openingHours = new ArrayList<>();

    /** Date-specific overrides of the weekly schedule. */
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "club_id")
    private List<ClubScheduleException> exceptions = new ArrayList<>();
}
