# *****************************************************************************
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
# ******************************************************************************

resource "random_string" "keycloak_password" {
  length = 16
  special = true
  override_special = "/@\" "
}


resource "kubernetes_secret" "keycloak_password_secret" {
  metadata {
    name = "keycloak-password"
  }

  data = {
    password = random_string.keycloak_password.result
  }
}

resource "random_string" "mongo_root_password" {
  length = 16
  special = true
  override_special = "/@\" "
}

resource "kubernetes_secret" "mongo_root_password_secret" {
  metadata {
    name = "mongo-root-password"
  }

  data = {
    password = random_string.mongo_root_password
  }
}

resource "random_string" "mongo_db_password" {
  length = 16
  special = true
  override_special = "/@\" "
}

resource "kubernetes_secret" "mongo_db_password_secret" {
  metadata {
    name = "mongo-db-password"
  }

  data = {
    password = random_string.mongo_db_password
  }
}

resource "random_string" "mysql_root_password" {
  length = 16
  special = true
  override_special = "/@\" "
}

resource "kubernetes_secret" "mysql_root_password_secret" {
  metadata {
    name = "mysql-root-password"
  }

  data = {
    password = random_string.mysql_root_password
  }
}

resource "random_string" "mysql_user_password" {
  length = 16
  special = true
  override_special = "/@\" "
}

resource "kubernetes_secret" "mysql_user_password_secret" {
  metadata {
    name = "mysql-user-password"
  }

  data = {
    password = random_string.mysql_user_password
  }
}