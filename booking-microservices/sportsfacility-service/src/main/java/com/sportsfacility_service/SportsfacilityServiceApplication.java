package com.sportsfacility_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients
@SpringBootApplication
public class SportsfacilityServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(SportsfacilityServiceApplication.class, args);
	}

}
