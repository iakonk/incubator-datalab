package com.epam.dlab.backendapi.resources;

import com.epam.dlab.auth.UserInfo;
import com.epam.dlab.backendapi.service.EnvironmentService;
import com.google.inject.Inject;
import io.dropwizard.auth.Auth;
import lombok.extern.slf4j.Slf4j;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("environment")
@Slf4j
@RolesAllowed("environment/*")
public class EnvironmentResource {

	@Inject
	private EnvironmentService environmentService;

	@GET
	@Path("user/active")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getUsersWithActiveEnv(@Auth UserInfo userInfo) {
		log.debug("User {} requested information about active environments", userInfo.getName());
		return Response.ok(environmentService.getActiveUsers()).build();
	}

	@POST
	@Consumes(MediaType.TEXT_PLAIN)
	@Path("terminate")
	public Response terminateEnv(@Auth UserInfo userInfo, String user) {
		log.info("User {} is terminating {} environment", userInfo.getName(), user);
		environmentService.terminateEnvironment(user);
		return Response.ok().build();
	}

	@POST
	@Consumes(MediaType.TEXT_PLAIN)
	@Path("stop")
	public Response stopEnv(@Auth UserInfo userInfo, String user) {
		log.info("User {} is stopping {} environment", userInfo.getName(), user);
		environmentService.stopEnvironment(user);
		return Response.ok().build();
	}
}
