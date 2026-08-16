package com.user_service.service;

import com.user_service.persistence.AppUser;
import com.user_service.persistence.IAppUserRepository;

import com.user_service.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppUserService {

    private final IAppUserRepository appUserRepository;
    private final JwtUtil jwtUtil;

    public AppUserService(IAppUserRepository appUserRepository, JwtUtil jwtUtil) {
        this.appUserRepository = appUserRepository;
        this.jwtUtil = jwtUtil;
    }

    public AppUser getUserByHeader(HttpServletRequest request){
        Long id = jwtUtil.extractUserId(request);
        return appUserRepository.findById(id).orElse(null);
    }

    public void deleteAppUser(HttpServletRequest request){
        Long userId = jwtUtil.extractUserId(request);
        appUserRepository.deleteById(userId);
    }

}
