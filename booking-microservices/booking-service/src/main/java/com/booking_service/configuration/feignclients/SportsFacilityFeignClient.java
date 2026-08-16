package com.booking_service.configuration.feignclients;

import com.booking_service.presentation.SearchFacilitiesRequest;
import com.booking_service.presentation.dtos.SportsFacilityDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "sportsfacility-service")
public interface SportsFacilityFeignClient {

    @PostMapping("/sportsfacility/search")
    List<SportsFacilityDto> search(@RequestBody SearchFacilitiesRequest request);

    @GetMapping("/sportsfacility/club/{id}")
    List<SportsFacilityDto> getSportsFacilityByClubId(@PathVariable("id") Long id);

    @GetMapping("/sportsfacility/{id}")
    SportsFacilityDto getSportsFacilityById(@PathVariable("id") Long id);
}
