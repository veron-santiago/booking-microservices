package com.sportsfacility_service.configuration.feignclients;

import com.sportsfacility_service.presentation.ClubDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "club-service")
public interface ClubFeignClient {

    @GetMapping("/club")
    ClubDto getClub();

}
