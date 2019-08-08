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

package com.epam.dlab.dto.exploratory;

import com.epam.dlab.dto.ResourceEnvBaseDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.base.MoreObjects.ToStringHelper;

public class ExploratoryBaseDTO<T extends ExploratoryBaseDTO<?>> extends ResourceEnvBaseDTO<T> {
	@SuppressWarnings("unchecked")
	private final T self = (T) this;
	@JsonProperty("notebook_image")
	private String notebookImage;
	@JsonProperty("project_name")
	private String project;

	public String getNotebookImage() {
		return notebookImage;
	}

	public void setNotebookImage(String notebookImage) {
		this.notebookImage = notebookImage;
	}

	public T withNotebookImage(String notebookImage) {
		setNotebookImage(notebookImage);
		return self;
	}

	public T withProject(String project) {
		setProject(project);
		return self;
	}

	@Override
	public ToStringHelper toStringHelper(Object self) {
		return super.toStringHelper(self)
				.add("notebookImage", notebookImage);
	}

	public String getProject() {
		return project;
	}

	public void setProject(String project) {
		this.project = project;
	}

	@Override
	public String toString() {
		return toStringHelper(this).toString();
	}
}
