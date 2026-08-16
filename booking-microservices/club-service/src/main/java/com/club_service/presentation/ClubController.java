package com.club_service.presentation;

import com.club_service.persistence.Club;
import com.club_service.persistence.ClubScheduleException;
import com.club_service.service.ClubService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/club")
public class ClubController {

    private final ClubService clubService;

    public ClubController(ClubService clubService) {
        this.clubService = clubService;
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<Club>> getNearbyClubs(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam double radiusKm
    ){
        return ResponseEntity.ok(
                clubService.getClubsByLocation(lat, lon, radiusKm)
        );
    }

    @GetMapping
    public ResponseEntity<Club> getClub(HttpServletRequest request) {
        Club club = clubService.getMyClub(request);
        if (club == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(club);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Club> getClubById(@PathVariable("id") Long id){
        Club club = clubService.getClubById(id);
        if (club == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(club);
    }

    @PostMapping("/internal")
    public ResponseEntity<Void> createClubFromUser(@RequestBody CreateClubRequest request) {
        clubService.createFromUser(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/location")
    public ResponseEntity<Club> updateLocation(HttpServletRequest request, @RequestBody ClubLocationRequest locationRequest){
        Club club = clubService.updateLocation(request, locationRequest);
        if (club == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(club);
    }

    @PutMapping("/schedule")
    public ResponseEntity<Club> updateSchedule(HttpServletRequest request, @RequestBody ScheduleRequest req) {
        return ResponseEntity.ok(clubService.updateSchedule(request, req));
    }

    @GetMapping("/exceptions")
    public ResponseEntity<List<ClubScheduleException>> getExceptions(HttpServletRequest request) {
        return ResponseEntity.ok(clubService.getMyExceptions(request));
    }

    @PostMapping("/exceptions")
    public ResponseEntity<Club> addException(HttpServletRequest request, @RequestBody ExceptionRequest req) {
        return ResponseEntity.ok(clubService.addException(request, req));
    }

    @DeleteMapping("/exceptions/{id}")
    public ResponseEntity<Club> deleteException(HttpServletRequest request, @PathVariable("id") Long id) {
        return ResponseEntity.ok(clubService.deleteException(request, id));
    }

}
