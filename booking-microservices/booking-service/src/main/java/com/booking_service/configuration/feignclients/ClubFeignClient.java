package com.booking_service.configuration.feignclients;

import com.booking_service.presentation.dtos.ClubDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "club-service")
public interface ClubFeignClient {

    @GetMapping("/club")
    ClubDto getMyClub();

    @GetMapping("/club/nearby")
    List<ClubDto> getNearbyClubs(@RequestParam double lat,
                                 @RequestParam double lon,
                                 @RequestParam double radiusKm);

    @GetMapping("/club/{id}")
    ClubDto getClubById(@PathVariable Long id);
}
