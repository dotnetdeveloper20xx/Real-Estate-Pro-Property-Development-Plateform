import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IApiResponse } from '../../land-acquisition/models/shared.model';

/**
 * Admin service for managing notification rules and templates.
 * Used by SuperAdmin pages for configuring the notification system.
 */

export interface INotificationRule {
  readonly id: string;
  readonly eventType: string;
  readonly module: string;
  readonly description: string;
  readonly recipientType: string;
  readonly recipientValue: string;
  readonly channel: string;
  readonly priority: string;
  readonly templateId: string | null;
  readonly templateName: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string | null;
}

export interface INotificationTemplate {
  readonly id: string;
  readonly name: string;
  readonly eventType: string;
  readonly titleTemplate: string;
  readonly bodyTemplate: string;
  readonly iconName: string;
  readonly severity: string;
  readonly variables: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string | null;
}

export interface INotificationHistoryItem {
  readonly id: string;
  readonly recipientUserId: string;
  readonly recipientName: string;
  readonly eventType: string;
  readonly module: string;
  readonly title: string;
  readonly message: string;
  readonly severity: string;
  readonly priority: string;
  readonly isRead: boolean;
  readonly channel: string;
  readonly deliveryStatus: string;
  readonly sentAt: string;
  readonly createdAt: string;
}

export interface ICreateNotificationRuleDto {
  eventType: string;
  module: string;
  description?: string;
  recipientType: string;
  recipientValue: string;
  channel?: string;
  priority?: string;
  templateId?: string | null;
  isActive?: boolean;
}

export interface IUpdateNotificationRuleDto {
  eventType?: string;
  module?: string;
  description?: string;
  recipientType?: string;
  recipientValue?: string;
  channel?: string;
  priority?: string;
  templateId?: string | null;
  isActive?: boolean;
}

export interface ICreateNotificationTemplateDto {
  name: string;
  eventType: string;
  titleTemplate: string;
  bodyTemplate: string;
  iconName?: string;
  severity?: string;
  variables?: string;
  isActive?: boolean;
}

export interface IUpdateNotificationTemplateDto {
  name?: string;
  eventType?: string;
  titleTemplate?: string;
  bodyTemplate?: string;
  iconName?: string;
  severity?: string;
  variables?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationAdminService {
  private readonly rulesUrl = '/api/v1/notification-rules';
  private readonly templatesUrl = '/api/v1/notification-templates';
  private readonly notificationsUrl = '/api/v1/notifications';

  constructor(private readonly http: HttpClient) {}

  // ── Rules ───────────────────────────────────────────────────────────────────

  getRules(module?: string): Observable<IApiResponse<INotificationRule[]>> {
    let params = new HttpParams();
    if (module) params = params.set('module', module);
    return this.http.get<IApiResponse<INotificationRule[]>>(this.rulesUrl, { params });
  }

  getRuleById(id: string): Observable<IApiResponse<INotificationRule>> {
    return this.http.get<IApiResponse<INotificationRule>>(`${this.rulesUrl}/${id}`);
  }

  createRule(dto: ICreateNotificationRuleDto): Observable<IApiResponse<{ id: string }>> {
    return this.http.post<IApiResponse<{ id: string }>>(this.rulesUrl, dto);
  }

  updateRule(id: string, dto: IUpdateNotificationRuleDto): Observable<IApiResponse<{ id: string }>> {
    return this.http.put<IApiResponse<{ id: string }>>(`${this.rulesUrl}/${id}`, dto);
  }

  deleteRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.rulesUrl}/${id}`);
  }

  toggleRule(id: string): Observable<IApiResponse<{ id: string; isActive: boolean }>> {
    return this.http.patch<IApiResponse<{ id: string; isActive: boolean }>>(`${this.rulesUrl}/${id}/toggle`, {});
  }

  // ── Templates ───────────────────────────────────────────────────────────────

  getTemplates(eventType?: string): Observable<IApiResponse<INotificationTemplate[]>> {
    let params = new HttpParams();
    if (eventType) params = params.set('eventType', eventType);
    return this.http.get<IApiResponse<INotificationTemplate[]>>(this.templatesUrl, { params });
  }

  getTemplateById(id: string): Observable<IApiResponse<INotificationTemplate>> {
    return this.http.get<IApiResponse<INotificationTemplate>>(`${this.templatesUrl}/${id}`);
  }

  createTemplate(dto: ICreateNotificationTemplateDto): Observable<IApiResponse<{ id: string }>> {
    return this.http.post<IApiResponse<{ id: string }>>(this.templatesUrl, dto);
  }

  updateTemplate(id: string, dto: IUpdateNotificationTemplateDto): Observable<IApiResponse<{ id: string }>> {
    return this.http.put<IApiResponse<{ id: string }>>(`${this.templatesUrl}/${id}`, dto);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.templatesUrl}/${id}`);
  }

  // ── Notification History (Admin) ────────────────────────────────────────────

  getAllNotifications(params?: {
    module?: string;
    eventType?: string;
    recipientUserId?: string;
    isRead?: boolean;
    startDate?: string;
    endDate?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<IApiResponse<INotificationHistoryItem[]>> {
    let httpParams = new HttpParams();
    if (params?.module) httpParams = httpParams.set('module', params.module);
    if (params?.eventType) httpParams = httpParams.set('eventType', params.eventType);
    if (params?.recipientUserId) httpParams = httpParams.set('recipientUserId', params.recipientUserId);
    if (params?.isRead !== undefined) httpParams = httpParams.set('isRead', params.isRead.toString());
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params?.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    return this.http.get<IApiResponse<INotificationHistoryItem[]>>(`${this.notificationsUrl}/all`, { params: httpParams });
  }
}
