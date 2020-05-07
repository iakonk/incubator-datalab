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

package com.epam.dlab.backendapi.service.impl.azure;

import com.epam.dlab.backendapi.service.BucketService;
import com.epam.dlab.dto.bucket.BucketDTO;

import java.io.InputStream;
import java.util.List;

public class BucketServiceAzureImpl implements BucketService {
    @Override
    public List<BucketDTO> getObjects(String bucket) {
        return null;
    }

    @Override
    public void uploadObject(String bucket, String object, InputStream stream) {

    }

    @Override
    public byte[] downloadObject(String bucket, String object) {
        return new byte[0];
    }

    @Override
    public void deleteObjects(String bucket, List<String> objects) {

    }
}
