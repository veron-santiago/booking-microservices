package com.user_service.configuration.feignclients;

import com.user_service.presentation.CreateClubRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "club-service")
public interface ClubFeignClient {

    @PostMapping("/club/internal")
    void createClub(@RequestBody CreateClubRequest request);

}
