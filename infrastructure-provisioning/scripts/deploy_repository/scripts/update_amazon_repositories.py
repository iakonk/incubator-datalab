#!/usr/bin/python
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


from fabric.api import *
import argparse


parser = argparse.ArgumentParser()
parser.add_argument('--region', required=True, type=str, default='', help='AWS region name')
args = parser.parse_args()


if __name__ == "__main__":
    nexus_password = 'NEXUS_PASSWORD'
    local('wget http://repo.{}.amazonaws.com/2017.09/main/mirror.list -O /tmp/main_mirror.list'.format(args.region))
    local('wget http://repo.{}.amazonaws.com/2017.09/updates/mirror.list -O /tmp/updates_mirror.list'.format(
        args.region))
    amazon_main_repo = local("cat /tmp/main_mirror.list  | grep {} | sed 's/$basearch//g'".format(args.region),
                             capture=True)
    amazon_updates_repo = local("cat /tmp/updates_mirror.list  | grep {} | sed 's/$basearch//g'".format(args.region),
                                capture=True)
    local('cp -f /opt/nexus/updateRepositories.groovy /tmp/updateRepositories.groovy')
    local('sed -i "s|AMAZON_MAIN_URL|{}|g" /tmp/updateRepositories.groovy'.format(amazon_main_repo))
    local('sed -i "s|AMAZON_UPDATES_URL|{}|g" /tmp/updateRepositories.groovy'.format(amazon_updates_repo))
    local('/usr/local/groovy/latest/bin/groovy /tmp/addUpdateScript.groovy -u "admin" -p "{}" '
          '-n "updateRepositories" -f "/tmp/updateRepositories.groovy" -h "http://localhost:8081"'.format(
           nexus_password))
    local('curl -u admin:{} -X POST --header \'Content-Type: text/plain\' '
          'http://localhost:8081/service/rest/v1/script/updateRepositories/run'.format(nexus_password))
    local('rm -f /tmp/main_mirror.list')
    local('rm -f /tmp/updates_mirror.list')
    local('rm -f /tmp/updateRepositories.groovy')
    print('Amazon repositories have been successfully updated!')
