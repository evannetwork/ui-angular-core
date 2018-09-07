/*
  Copyright (C) 2018-present evan GmbH.

  This program is free software: you can redistribute it and/or modify it
  under the terms of the GNU Affero General Public License, version 3,
  as published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program. If not, see http://www.gnu.org/licenses/ or
  write to the Free Software Foundation, Inc., 51 Franklin Street,
  Fifth Floor, Boston, MA, 02110-1301 USA, or download the license from
  the following URL: https://evan.network/license/

  You can be released from the requirements of the GNU Affero General Public
  License by purchasing a commercial license.
  Buying such a license is mandatory as soon as you use this software or parts
  of it on other blockchains than evan.network.

  For more information, please contact evan GmbH at this address:
  https://evan.network/license/
*/

export const de = {
  'error': {
    'not_implemented': 'Nicht implementiert'
  },
  'metamask' : 'Metamask',
  'edit': 'Editieren',
  'remove': 'Entfernen',
  'submit': 'Akzeptieren',
  'cancel': 'Abbrechen',
  'open' : 'Öffnen',
  'loading-dapp': 'Laden...',
  'go-to': 'Öffne',
  'go-to-dappdashboard': 'zum Dashboard',
  'go-to-evan': 'Zu Evan',
  'go-to-mails': 'zu den Mailbox-Nachrichten',
  'no-alias': 'Kein Alias',
  'evan-reload': 'Aktualisieren...',
  'go-to-queue': 'Synchronisations-Details',
  '_angularcorequeue': {
    'new-entry-added': 'Eintrag wurde zur Blockchain-Warteschlange hinzugefügt...',
    'show-new-entry': 'Anzeigen',
    'hint': {
      'button': 'Ok',
      'description': `
        Es wurde ein neuer Eintrag in die <b>Evan Blockchain Queue</b> hinzugefügt.
        <br><br>
        Jegliche Daten werden <b>lokal</b> gespeichert. Das ermöglicht das Arbeiten unter folgenden
        Aspekten:
        <ul>
          <li>offline</li>
          <li>schnell</li>
          <li>leicht gewichtig</li>
        </ul>

        <div class="evan-seperator"></div>
        Um diese Daten in die Blockchain zu persitieren, navigiere mit den
        folgenden Interaktionsmöglichkeiten zur Queue Übersicht:

        <ul>
          <li>der <b>hellblaue Button</b> in der <b>oberen, rechten</b> Ecke des Bildschirms</li>
          <li>Nutze den <b>"zeigen"</b> Button in der <b>Toast Benachrichtigung</b> in der
          <b>unteren</b> Seite des Bildschirms</li>
        </ul>
      `,
      'show-again': 'Nicht mehr anzeigen',
      'show-queue': 'Queue anzeigen',
      'title': 'Blockchain Queue'
    },
    'queue-hint': 'Datensynchronisation',
    'queue-hint-description': `
      Diese Übersicht enthält alle für Sie lokal gespeicherten Daten. Durch klicken auf
      "Synchronisation starten" werden die Daten des jeweiligen Segments permantent gespeichert.
      <br><br>
      <b>Bitte beachten:</b><br><br> Die Synchronisation kann mehrere Minuten in Anspruch nehmen.<br>
      Bitte schließen sie nicht diese Seite / Applikation.<br>
      Sie können während dessen jede andere Seite der Evan Applikation verwenden.
    `,
    'sync-finished': 'Synchronisation abgeschlossen',
    'show': 'Anzeigen',
    'removeQueueEntry': 'Eintrag entfernen',
    'removeQueueEntryDescription': `Wollen sie diesen Eintrag wirklich löschen? Er wird permanent
     von dem lokalen Speicher entfern.
    `,
    'remove': 'Entfernen',
    'slider': {
      '0': 'Synchronisations Status',
      '1': 'Zu speichernde Daten',
      '2': 'Zu speichernde Daten'
    },
    'startsync': 'Synchronisation starten',
    'error-occured': 'Ein Fehler ist aufgetreten.',
    'retry': 'Erneut versuchen...',
    'retry-description': `
      Meistens werden Synchronisationsprobleme durch Netzwerkeinschränkungen verursacht.
      Bitte versuchen sie es erneut.
    `,
    'empty-queue': 'Keine Daten zur Synchronisation verfügbar',
    'empty-queue-description': 'Es existieren keine Daten zum Synchronisieren. Sie können mit ihrer Arbeit fortfahren.',
    'go-back': 'Zurück',
    'sync-all': 'Alle Daten synchronisieren',
    'synchronising': 'Synchronisieren...',
    'enable-auto-sync': 'Automatische Synchronisierung',
    'configuration': 'Konfiguration',
    'enable-auto-sync-desc': `
      Die automatische Synchronisierung ermöglicht das sofortige speichern Ihrer lokalen Daten.
      <br><br>
      Wenn sie disen Prozess manuell handhaben wollen, um Ihre lokalen Änderungen zu überprüfen,
      können sie die automatische Synchronisation stoppen.
    `,
    'detail-view': 'Ausführliche Synchronisationsdaten anzeigen',
    'sidepanel-header': 'Synchronisation',
    'saving': 'Speicherung von',
    'sidepanel-data-sets': 'Datenänderungen',
    'sidepanel-empty-queue': 'Alles ist aktuell',
    'error': 'Fehler',
    'report-error': 'Fehler senden'
  },
  '_angularcore': {
    'error-downloading': 'Fehler beim herunterladen der Datei aufgetreten.',
    'finished-downloading': 'Die Datei {{ fileName }} wurde erfolgreich in den Downloads gespeichert.',
    'new-notification': 'Neue Benachrichtigung',
    'load-more': 'Mehr laden...',
    'loaded-paging-entries': 'Geladen',
    'camera': 'Kamera',
    'refresh': 'Aktualisieren...',
    'refreshing': 'Aktualisiere...',
    'dapps': 'DApps',
    'evan-network': 'evan.network',
    'account-changed': 'Account wurde geändert',
    'account-changed-description': `
      Sie haben Ihren aktiven Account geändert.<br>
      Die Seite / Applikation muss <b>neu geladen werden</b>.
    `,
    'loading': 'Laden...',
    'not-implemented': 'Bald verfügbar...',
    'no-alias': 'Kein Alias',
    'form-alert': {
      'from-alias': 'Ihr Name der in der Anfrage gesendet werden soll',
      'from-title': 'Betreff',
      'from-body': 'Nachricht',
      'submit': 'Bestätigen',
      'cancel': 'Abbrechen',
      'close': 'Schließen'
    },
    'new-mails': 'Neue Mails erhalten ({{ newMailCount }}).',
    'copied': 'Kopiert: "{{ stringToCopy }}"',
    'password': 'Passwort',
    'use-password': 'Entsperren',
    'logout': 'Abmelden',
    'logout-desc': 'Wollen sie sich wirklich abmelden?',
    'cancel': 'Abbrechen',
    'user-locked': 'Profil gesperrt',
    'invalid-password': 'Es wurde ein falsches Passwort angegeben...',
    'requests-permissions': 'benötigt Rechte auf',
    'my-profile': 'Mein Profil',
    'smart-agent': {
      'desc': 'Beschreibung',
      'trusted-by': 'Verifiziert durch',
      'created-by': 'Erstellt von',
      'created-at': 'Erstellt am',
      'trusted-at': 'Verifiziert am',
      'rights': {
        'key-exchange': 'Schlüsselaustausch',
        'key-exchange-desc': 'Ermöglicht sichere Kommunikation',
        'mailbox-send': 'Mailbox Nachrichten senden',
        'mailbox-send-desc': 'Kann Nachrichten senden'
      }
    },
    'qrcode': {
      'header': 'QR Code einscannen',
      'camera-select': 'Kameraauswahl',
      'no-camera-selected': 'Keine Kamera ausgewählt'
    },
    'contract-members': {
      'search-text': 'Suche Kontakte, um sie hinzuzufügen...',
      'i': 'Mein Account',
      'add-members': 'Mitglieder hinzufügen',
      'no-suggestions': 'Keine Mitglieder gefunden oder keine weiteren verfügbar',
      'members': 'Mitglieder',
      'new-members': '{{ count }} wurden neu hinzugefügt',
      'states': {
        'undefined': 'Neu',
        '0': 'Initial',
        '1': 'Fehler',
        '2': 'Entwurf',
        '3': 'Abgelehnt',
        '4': 'Aktiv',
        '5': 'Abgeschlossen',
        'loading': 'Aktualisieren...'
      },
      'suggested-members': 'Vorgeschlagene Mitglieder'
    },
    'snapshot': {
      'header': 'Bild aufnehmen',
      'video_no_available': 'Kamera ist nicht verfügbar'
    },
    "month-short-names": "Jan,Feb,Mär,Apr,Mai,Jun,Jul,Aug,Sep,Okt,Nov,Dez",
    "file-select": "Dateien auswählen"
  },
  '_logging': {
    'logs-sent': 'Vielen Dank! Ihre logs wurden an evan.network Entwickler weitergeleitet.',
    'log_question_title': 'Fehler senden',
    'log_question_message': `
      Senden sie Fehler zu Analysezwecken an die evan.network Entwickler.<br>
      Nutzen Sie "Fehler senden" um nur die aufgetrenen Fehler zu senden.<br>
      Mit Hilfe von "Detailierte Auswertung senden" lässt sich die vollständige Historie der Applikation
      auswerten, filtern und versenden.
    `,
    'log_close': 'schließen',
    'ignore': 'Ignorieren und Logs leeren',
    'log_detailed': 'Detailierte Auswertung senden',
    'log_only_errors': 'Fehler senden',
  },
  '_loading': {
    'loaded-to-long': 'Die DApp lädt länger als erwartet.',
    'go-back': 'zurück zur letzten DApp'
  }
}
