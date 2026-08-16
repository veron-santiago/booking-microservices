package com.user_service.presentation;

import com.user_service.persistence.AppUser;
import com.user_service.service.AppUserService;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class AppUserController {

    private final AppUserService appUserService;

    public AppUserController(AppUserService appUserService) {
        this.appUserService = appUserService;
    }

    @GetMapping
    public ResponseEntity<AppUser> getAppUser(HttpServletRequest request){
        AppUser appUser = appUserService.getUserByHeader(request);
        if (appUser == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(appUser);
    }

    @DeleteMapping
    public void deleteAppUser(HttpServletRequest request){
        appUserService.deleteAppUser(request);
    }

}
