package com.sportsfacility_service.presentation;

import com.sportsfacility_service.persistence.FacilityScheduleException;
import com.sportsfacility_service.persistence.SportType;
import com.sportsfacility_service.persistence.SportsFacility;
import com.sportsfacility_service.service.SportsFacilityService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/sportsfacility")
public class SportsFacilityController {

    private final SportsFacilityService sportsFacilityService;

    public SportsFacilityController(SportsFacilityService sportsFacilityService) {
        this.sportsFacilityService = sportsFacilityService;
    }

    @GetMapping("/sports")
    public ResponseEntity<List<String>> getSports() {
        return ResponseEntity.ok(
                Arrays.stream(SportType.values())
                        .map(Enum::name)
                        .toList()
        );
    }

    @PostMapping("/search")
    public ResponseEntity<List<SportsFacility>> getFacilitiesByFilter(@RequestBody SearchRequest request){
        List<SportsFacility> facilities = sportsFacilityService.getFacilitiesByFilter(request);
        if (facilities == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(facilities);
    }

    @GetMapping("/club/{id}")
    public ResponseEntity<List<SportsFacility>> getSportsFacilityByClubId(@PathVariable("id") Long id){
        List<SportsFacility> sportsFacilities = sportsFacilityService.getAllByClubId(id);
        if (sportsFacilities == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(sportsFacilities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SportsFacility> getSportsFacilityById(HttpServletRequest request, @PathVariable("id") Long id){
        SportsFacility sportsFacility = sportsFacilityService.getFacilityById(request, id);
        if (sportsFacility == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(sportsFacility);
    }

    @PostMapping()
    public ResponseEntity<SportsFacility> createSportFacility(HttpServletRequest request, @RequestBody CreateSportsFacility sportsFacility){
        SportsFacility sf = sportsFacilityService.createSportFacility(request, sportsFacility);
        if (sf == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(sf);
    }

    @DeleteMapping("/{id}")
    public void deleteSportsEntity(HttpServletRequest request, @PathVariable("id") Long id){
        sportsFacilityService.deleteFacility(request, id);
    }

    @PutMapping("/{id}/schedule")
    public ResponseEntity<SportsFacility> updateSchedule(HttpServletRequest request,
                                                         @PathVariable("id") Long id,
                                                         @RequestBody ScheduleRequest req){
        return ResponseEntity.ok(sportsFacilityService.updateSchedule(request, id, req));
    }

    @GetMapping("/{id}/exceptions")
    public ResponseEntity<List<FacilityScheduleException>> getExceptions(HttpServletRequest request,
                                                                         @PathVariable("id") Long id){
        return ResponseEntity.ok(sportsFacilityService.getExceptions(request, id));
    }

    @PostMapping("/{id}/exceptions")
    public ResponseEntity<SportsFacility> addException(HttpServletRequest request,
                                                       @PathVariable("id") Long id,
                                                       @RequestBody ExceptionRequest req){
        return ResponseEntity.ok(sportsFacilityService.addException(request, id, req));
    }

    @DeleteMapping("/{id}/exceptions/{exceptionId}")
    public ResponseEntity<SportsFacility> deleteException(HttpServletRequest request,
                                                          @PathVariable("id") Long id,
                                                          @PathVariable("exceptionId") Long exceptionId){
        return ResponseEntity.ok(sportsFacilityService.deleteException(request, id, exceptionId));
    }

}
