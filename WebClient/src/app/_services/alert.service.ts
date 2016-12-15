import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AlertService {
    private subject = new Subject<any>();

    success(message: string, keepAfterNavigationChange = false) {
        this.subject.next({ type: 'success', text: message });
    }

    error(message: string, keepAfterNavigationChange = false) {
        this.subject.next({ type: 'error', text: message });
    }

    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }
}
