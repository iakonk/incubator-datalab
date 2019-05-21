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
/* tslint:disable:no-empty */

import { Component, ViewChild, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material';

import { UserResourceService } from '../../core/services';
import { CreateResourceModel } from './create-resource.model';
import { ResourcesGridRowModel } from './resources-grid.model';
import { FilterConfigurationModel } from './filter-configuration.model';
import { GeneralEnvironmentStatus } from '../../administration/management/management.model';
import { ConfirmationDialogType } from '../../shared';
import { SortUtil } from '../../core/util';
import { DetailDialogComponent } from '../exploratory/detail-dialog';
import { AmiCreateDialogComponent } from '../exploratory/ami-create-dialog';
import { InstallLibrariesComponent } from '../exploratory/install-libraries';
import { ComputationalResourceCreateDialogComponent } from '../computational/computational-resource-create-dialog/computational-resource-create-dialog.component';
import { CostDetailsDialogComponent } from '../billing/cost-details-dialog';
import { SchedulerComponent } from '../scheduler';

import { DICTIONARY } from '../../../dictionary/global.dictionary';

@Component({
  selector: 'resources-grid',
  templateUrl: 'resources-grid.component.html',
  styleUrls: ['./resources-grid.component.css']
})

export class ResourcesGridComponent implements OnInit {
  readonly DICTIONARY = DICTIONARY;

  environments: Array<ResourcesGridRowModel>;
  filteredEnvironments: Array<ResourcesGridRowModel> = [];
  filterConfiguration: FilterConfigurationModel;
  filterForm: FilterConfigurationModel = new FilterConfigurationModel('', [], [], [], '');
  model = new CreateResourceModel('', '');
  notebookName: string;
  isOutscreenDropdown: boolean;
  collapseFilterRow: boolean = false;
  filtering: boolean = false;
  activeFiltering: boolean = false;
  healthStatus: GeneralEnvironmentStatus;
  delimitersRegex = /[-_]?/g;

  // @ViewChild('computationalResourceModal') computationalResourceModal;
  @ViewChild('confirmationDialog') confirmationDialog;
  @ViewChild('detailDialog') detailDialog;
  @ViewChild('costDetailsDialog') costDetailsDialog;
  // @ViewChild('envScheduler') scheduler;

  public filteringColumns: Array<any> = [
    { title: 'Environment name', name: 'name', className: 'th_name', filtering: {} },
    { title: 'Status', name: 'statuses', className: 'th_status', filtering: {} },
    { title: DICTIONARY.instance_size, name: 'shapes', className: 'th_shape', filtering: {} },
    { title: DICTIONARY.computational_resource, name: 'resources', className: 'th_resources', filtering: {} },
    { title: 'Cost', name: 'cost', className: 'th_cost' },
    { title: 'Actions', className: 'th_actions' }
  ];

  constructor(
    public toastr: ToastrService,
    private userResourceService: UserResourceService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.buildGrid();
  }

  toggleFilterRow(): void {
    this.collapseFilterRow = !this.collapseFilterRow;
  }

  getDefaultFilterConfiguration(): void {
    const data: Array<ResourcesGridRowModel> = this.environments;
    const shapes = [], statuses = [], resources = [];

    data.forEach((item: any) => {
      if (shapes.indexOf(item.shape) === -1)
        shapes.push(item.shape);
      if (statuses.indexOf(item.status) === -1)
        statuses.push(item.status);
        statuses.sort(SortUtil.statusSort);

      item.resources.forEach((resource: any) => {
        if (resources.indexOf(resource.status) === -1)
          resources.push(resource.status);
          resources.sort(SortUtil.statusSort);
      });
    });

    this.filterConfiguration = new FilterConfigurationModel('', statuses, shapes, resources, '');
  }

  applyFilter_btnClick(config: FilterConfigurationModel) {
    this.filtering = true;

    // let filteredData: Array<ResourcesGridRowModel> = this.environments.map(env => (<any>Object).assign({}, env));
    let filteredData: Array<ResourcesGridRowModel> = this.environments.map(env => (<any>Object).create(env));
    const containsStatus = (list, selectedItems) => {
      return list.filter((item: any) => { if (selectedItems.indexOf(item.status) !== -1) return item; });
    };

    config && (filteredData = filteredData.filter((item: any) => {
      const isName = item.name.toLowerCase().indexOf(config.name.toLowerCase()) !== -1;
      const isStatus = config.statuses.length > 0 ? (config.statuses.indexOf(item.status) !== -1) : (config.type !== 'active');
      const isShape = config.shapes.length > 0 ? (config.shapes.indexOf(item.shape) !== -1) : true;

      const modifiedResources = containsStatus(item.resources, config.resources);
      let isResources = config.resources.length > 0 ? (modifiedResources.length > 0) : true;

      if (config.resources.length > 0 && modifiedResources.length > 0) { item.resources = modifiedResources; }
      if (config.resources.length === 0 && config.type === 'active' ||
        modifiedResources.length >= 0 && config.resources.length > 0 && config.type === 'active') {
        item.resources = modifiedResources;
        isResources = true;
      }

      return isName && isStatus && isShape && isResources;
    }));

    config && this.updateUserPreferences(config);
    this.filteredEnvironments = filteredData;
  }

  showActiveInstances(): void {
    this.filterForm = this.loadUserPreferences(this.filterActiveInstances());
    this.applyFilter_btnClick(this.filterForm);
    this.buildGrid();
  }

  isResourcesInProgress(notebook) {
    const filteredEnv: any = this.environments.find(env => env.name === notebook.name);

    if (filteredEnv && filteredEnv.resources.length) {
      return filteredEnv.resources.filter(resource => (
        resource.status !== 'failed'
        && resource.status !== 'terminated'
        && resource.status !== 'running'
        && resource.status !== 'stopped')).length > 0;
    }
    return false;
  }

  filterActiveInstances(): FilterConfigurationModel {
    const filteredData = (<any>Object).assign({}, this.filterConfiguration);
    for (const index in filteredData) {
      if (filteredData[index] instanceof Array)
        filteredData[index] = filteredData[index].filter((item: string) => {
          return (item !== 'failed' && item !== 'terminated' && item !== 'terminating');
        });
      if (index === 'shapes') { filteredData[index] = []; }
    }

    filteredData.type = 'active';

    return filteredData;
  }

  aliveStatuses(сonfig): void {
    for (const index in this.filterConfiguration) {
      if (сonfig[index] && сonfig[index] instanceof Array)
         сonfig[index] = сonfig[index].filter(item => this.filterConfiguration[index].includes(item));
    }

    return сonfig;
  }

  isActiveFilter(filterConfig): void {
    this.activeFiltering = false;

    for (const index in filterConfig)
      if (filterConfig[index].length)
        this.activeFiltering = true;
  }

  onUpdate($event) {
    this.filterForm[$event.type] = $event.model;
  }

  resetFilterConfigurations(): void {
    this.filterForm.resetConfigurations();
    this.updateUserPreferences(this.filterForm);
    this.buildGrid();
  }

  buildGrid(): void {

    this.userResourceService.getUserProvisionedResources()
      .subscribe((result) => {
        this.environments = this.loadEnvironments(result.exploratory, result.shared);
        this.getDefaultFilterConfiguration();

        (this.environments.length) ? this.getUserPreferences() : this.filteredEnvironments = [];
      });
  }

  containsNotebook(notebook_name: string): boolean {
    if (notebook_name)
      for (let index = 0; index < this.environments.length; index++)
        if (this.delimitersFiltering(notebook_name) === this.delimitersFiltering(this.environments[index].name))
          return true;

    return false;
  }

  public delimitersFiltering(notebook_name): string {
    return notebook_name.replace(this.delimitersRegex, '').toString().toLowerCase();
  }

  loadEnvironments(exploratoryList: Array<any>, sharedDataList: any): Array<ResourcesGridRowModel> {
    if (exploratoryList && sharedDataList) {
      return exploratoryList.map((value) => {
        return new ResourcesGridRowModel(value.exploratory_name,
          value.template_name,
          value.image,
          value.status,
          value.shape,
          value.computational_resources,
          value.up_time,
          value.exploratory_url,
          sharedDataList.edge_node_ip,
          value.exploratory_user,
          value.exploratory_pass,
          sharedDataList[DICTIONARY.bucket_name],
          sharedDataList[DICTIONARY.shared_bucket_name],
          value.error_message,
          value[DICTIONARY.billing.cost],
          value[DICTIONARY.billing.currencyCode],
          value.billing,
          value.libs,
          sharedDataList[DICTIONARY.user_storage_account_name],
          sharedDataList[DICTIONARY.shared_storage_account_name],
          sharedDataList[DICTIONARY.datalake_name],
          sharedDataList[DICTIONARY.datalake_user_directory_name],
          sharedDataList[DICTIONARY.datalake_shared_directory_name],
        );
      });
    }
  }

  getUserPreferences(): void {
    this.userResourceService.getUserPreferences()
      .subscribe((result: FilterConfigurationModel) => {
        if (result) {
          this.isActiveFilter(result);
          this.filterForm = this.loadUserPreferences(result.type ? this.filterActiveInstances() : this.aliveStatuses(result));
        }
        this.applyFilter_btnClick(result ? this.filterForm : result);
      }, () => this.applyFilter_btnClick(null));
  }

  loadUserPreferences(config): FilterConfigurationModel {
    return new FilterConfigurationModel(config.name, config.statuses, config.shapes, config.resources, config.type);
  }

  updateUserPreferences(filterConfiguration: FilterConfigurationModel): void {
    this.userResourceService.updateUserPreferences(filterConfiguration)
      .subscribe((result) => { },
      (error) => {
        console.log('UPDATE USER PREFERENCES ERROR ', error);
      });
  }

  printDetailEnvironmentModal(data): void {
    // this.detailDialog.open({ isFooter: false }, data);
    this.dialog.open(DetailDialogComponent, { data: data, panelClass: 'modal-lg' })
               .afterClosed().subscribe(() => this.buildGrid());
  }

  printCostDetails(data): void {
    // this.costDetailsDialog.open({ isFooter: false }, data);
    this.dialog.open(CostDetailsDialogComponent, { data: data })
               .afterClosed().subscribe(() => this.buildGrid());
  }

  exploratoryAction(data, action: string) {
    if (action === 'deploy') {
      this.notebookName = data.name;
      // this.computationalResourceModal.open({ isFooter: false }, data, this.environments);

      this.dialog.open(ComputationalResourceCreateDialogComponent, { data: { notebook: data, full_list: this.environments}})
                 .afterClosed().subscribe(() => this.buildGrid());
    } else if (action === 'run') {
      this.userResourceService
        .runExploratoryEnvironment({ notebook_instance_name: data.name })
        .subscribe(
          () => this.buildGrid(),
          error => this.toastr.error(error.message || 'Exploratory starting failed!', 'Oops!'));
    } else if (action === 'stop') {
      this.confirmationDialog.open({ isFooter: false }, data, ConfirmationDialogType.StopExploratory);
    } else if (action === 'terminate') {
      this.confirmationDialog.open({ isFooter: false }, data, ConfirmationDialogType.TerminateExploratory);
    } else if (action === 'install') {
      this.dialog.open(InstallLibrariesComponent, { data: data })
                 .afterClosed().subscribe(() => this.buildGrid());
    } else if (action === 'schedule') {
      // this.scheduler.open({ isFooter: false }, data, 'EXPLORATORY');
      this.dialog.open(SchedulerComponent, { data: {notebook: data, type: 'EXPLORATORY'} })
                 .afterClosed().subscribe(() => this.buildGrid());
    } else if (action === 'ami') {
      this.dialog.open(AmiCreateDialogComponent, { data: data })
                 .afterClosed().subscribe(() => this.buildGrid());
    }
  }
}
