/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package com.epam.dlab.backendapi.resources.azure;

import com.epam.dlab.auth.UserInfo;
import com.epam.dlab.auth.rest.UserSessionDurationAuthorizer;
import com.epam.dlab.backendapi.conf.SelfServiceApplicationConfiguration;
import com.epam.dlab.backendapi.dao.ComputationalDAO;
import com.epam.dlab.backendapi.dao.ExploratoryDAO;
import com.epam.dlab.backendapi.resources.dto.SparkStandaloneClusterCreateForm;
import com.epam.dlab.backendapi.roles.RoleType;
import com.epam.dlab.backendapi.roles.UserRoles;
import com.epam.dlab.backendapi.service.ComputationalService;
import com.epam.dlab.constants.ServiceConsts;
import com.epam.dlab.dto.aws.computational.ClusterConfig;
import com.epam.dlab.exceptions.DlabException;
import com.epam.dlab.rest.client.RESTService;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import io.dropwizard.auth.Auth;
import lombok.extern.slf4j.Slf4j;

import javax.annotation.security.RolesAllowed;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;

/**
 * Provides the REST API for the computational resource on Azure.
 */
@Path("/infrastructure_provision/computational_resources")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Slf4j
public class ComputationalResourceAzure {

	@Inject
	private ExploratoryDAO exploratoryDAO;

	@Inject
	private ComputationalDAO computationalDAO;

	@Inject
	@Named(ServiceConsts.PROVISIONING_SERVICE_NAME)
	private RESTService provisioningService;

	@Inject
	private SelfServiceApplicationConfiguration configuration;

	@Inject
	private ComputationalService computationalService;

	/**
	 * Asynchronously creates computational Spark cluster.
	 *
	 * @param userInfo user info.
	 * @param form     user info about creation of the computational resource.
	 * @return 200 OK if request success, 302 Found - for duplicates, otherwise throws exception.
	 * @throws IllegalArgumentException if input is not valid or exceeds configuration limits
	 */
	@PUT
	@Path("dataengine")
	@RolesAllowed(UserSessionDurationAuthorizer.SHORT_USER_SESSION_DURATION)
	public Response createDataEngine(@Auth UserInfo userInfo,
									 @Valid @NotNull SparkStandaloneClusterCreateForm form) {
		log.debug("Create computational resources for {} | form is {}", userInfo.getName(), form);

		if (!UserRoles.checkAccess(userInfo, RoleType.COMPUTATIONAL, form.getImage(), userInfo.getRoles())) {
			log.warn("Unauthorized attempt to create a {} by user {}", form.getImage(), userInfo.getName());
			throw new DlabException("You do not have the privileges to create a " + form.getTemplateName());
		}

		return computationalService.createSparkCluster(userInfo, form, form.getProject())
				? Response.ok().build()
				: Response.status(Response.Status.FOUND).build();

	}

	/**
	 * Sends request to provisioning service for termination the computational resource for user.
	 *
	 * @param userInfo          user info.
	 * @param exploratoryName   name of exploratory.
	 * @param computationalName name of computational resource.
	 * @return 200 OK if operation is successfully triggered
	 */
	@DELETE
	@Path("/{exploratoryName}/{computationalName}/terminate")
	public Response terminate(@Auth UserInfo userInfo,
							  @PathParam("exploratoryName") String exploratoryName,
							  @PathParam("computationalName") String computationalName) {

		log.debug("Terminating computational resource {} for user {}", computationalName, userInfo.getName());

		computationalService.terminateComputational(userInfo, exploratoryName, computationalName);

		return Response.ok().build();
	}

	/**
	 * Sends request to provisioning service for stopping the computational resource for user.
	 *
	 * @param userInfo          user info.
	 * @param exploratoryName   name of exploratory.
	 * @param computationalName name of computational resource.
	 * @return 200 OK if operation is successfully triggered
	 */
	@DELETE
	@Path("/{project}/{exploratoryName}/{computationalName}/stop")
	public Response stop( @Auth UserInfo userInfo,
						 @PathParam("exploratoryName") String exploratoryName,
						 @PathParam("computationalName") String computationalName) {
		log.debug("Stopping computational resource {} for user {}", computationalName, userInfo.getName());

		computationalService.stopSparkCluster(userInfo, exploratoryName, computationalName);

		return Response.ok().build();
	}

	/**
	 * Sends request to provisioning service for starting the computational resource for user.
	 *
	 * @param userInfo          user info.
	 * @param exploratoryName   name of exploratory.
	 * @param computationalName name of computational resource.
	 * @return 200 OK if operation is successfully triggered
	 */
	@PUT
	@Path("/{project}/{exploratoryName}/{computationalName}/start")
	public Response start(@Auth UserInfo userInfo,
						  @PathParam("exploratoryName") String exploratoryName,
						  @PathParam("computationalName") String computationalName,
						  @PathParam("project") String project) {
		log.debug("Starting computational resource {} for user {}", computationalName, userInfo.getName());

		computationalService.startSparkCluster(userInfo, exploratoryName, computationalName, project);

		return Response.ok().build();
	}

	@PUT
	@Path("dataengine/{exploratoryName}/{computationalName}/config")
	public Response updateDataEngineConfig(@Auth UserInfo userInfo,
										   @PathParam("exploratoryName") String exploratoryName,
										   @PathParam("computationalName") String computationalName,
										   @Valid @NotNull List<ClusterConfig> config) {

		computationalService.updateSparkClusterConfig(userInfo, exploratoryName, computationalName, config);
		return Response.ok().build();
	}

	@GET
	@Path("{exploratoryName}/{computationalName}/config")
	public Response getClusterConfig(@Auth UserInfo userInfo,
									 @PathParam("exploratoryName") String exploratoryName,
									 @PathParam("computationalName") String computationalName) {
		return Response.ok(computationalService.getClusterConfig(userInfo, exploratoryName, computationalName)).build();
	}
}
