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
  "_angularcore": {
    "account-changed": "Account wurde geändert",
    "account-changed-description": "Sie haben Ihren aktiven Account geändert.<br> Die Seite / Applikation muss <b>neu geladen werden</b>.",
    "camera": "Kamera",
    "cancel": "Abbrechen",
    "contract-members": {
      "add-members": "Mitglieder hinzufügen",
      "i": "Mein Account",
      "members": "Mitglieder",
      "new-members": "{{ count }} wurden neu hinzugefügt",
      "no-suggestions": "Keine Mitglieder gefunden oder keine weiteren verfügbar",
      "search-text": "Suche Kontakte, um sie hinzuzufügen...",
      "states": {
        "0": "Initial",
        "1": "Fehler",
        "2": "Entwurf",
        "3": "Abgelehnt",
        "4": "Aktiv",
        "5": "Abgeschlossen",
        "loading": "Aktualisieren...",
        "undefined": "Neu"
      },
      "suggested-members": "Vorgeschlagene Mitglieder"
    },
    "copied": "Kopiert: \"{{ stringToCopy }}\"",
    "dapps": "DApps",
    "error-downloading": "Fehler beim Herunterladen der Datei aufgetreten.",
    "evan-network": "evan.network",
    "file-select": "Dateien auswählen",
    "finished-downloading": "Die Datei {{ fileName }} wurde erfolgreich in den Downloads gespeichert.",
    "form-alert": {
      "cancel": "Abbrechen",
      "close": "Schließen",
      "from-alias": "Ihr Name, der in der Anfrage gesendet werden soll",
      "from-body": "Nachricht",
      "from-title": "Betreff",
      "submit": "Bestätigen"
    },
    "invalid-password": "Es wurde ein falsches Passwort angegeben...",
    "load-more": "Mehr laden...",
    "loaded-paging-entries": "Geladen",
    "loading": "Laden...",
    "logout": "Abmelden",
    "logout-desc": "Wollen Sie sich wirklich abmelden?",
    "month-short-names": "Jan,Feb,Mär,Apr,Mai,Jun,Jul,Aug,Sep,Okt,Nov,Dez",
    "my-profile": "Mein Profil",
    "new-mails": "Neue Mails erhalten ({{ newMailCount }}).",
    "new-notification": "Neue Benachrichtigung",
    "no-alias": "Kein Alias",
    "not-implemented": "Bald verfügbar...",
    "password": "Passwort",
    "qrcode": {
      "camera-select": "Kameraauswahl",
      "header": "QR Code einscannen",
      "no-camera-selected": "Keine Kamera ausgewählt"
    },
    "refresh": "Aktualisieren...",
    "refreshing": "Aktualisiere...",
    "requests-permissions": "benötigt Rechte auf",
    "smart-agent": {
      "created-at": "Erstellt am",
      "created-by": "Erstellt von",
      "desc": "Beschreibung",
      "rights": {
        "key-exchange": "Schlüsselaustausch",
        "key-exchange-desc": "Ermöglicht sichere Kommunikation",
        "mailbox-send": "Mailbox Nachrichten senden",
        "mailbox-send-desc": "Kann Nachrichten senden"
      },
      "trusted-at": "Verifiziert am",
      "trusted-by": "Verifiziert durch"
    },
    "snapshot": {
      "header": "Bild aufnehmen",
      "video_no_available": "Kamera ist nicht verfügbar"
    },
    "use-password": "Entsperren",
    "user-locked": "Profil gesperrt",
    "warnings": {
      "dont-show-again": "Meldung nicht mehr anzeigen",
      "eve-empty": {
        "body": "Sie haben ihr vollständiges Kondingent an Eve's aufgebraucht ({{ value }} Eves). Es ist nicht mehr möglich, Verträge zu erstellen oder Transaktionen zu senden.",
        "title": "Eve's sind aufgebraucht"
      },
      "eve-low": {
        "body": "Sie haben fast ihr vollständiges Kondingent an Eve's aufgebraucht ({{ value }} Eves). Es ist möglich, dass spezielle Aktionen (Vertragserstellungen, Speichertransaktionen) bei einem zu geringen Eve Wert fehlschlagen.",
        "title": "Eve's sind fast aufgebraucht"
      }
    }
  },
  "_angularcorequeue": {
    "configuration": "Konfiguration",
    "detail-view": "Ausführliche Synchronisationsdaten anzeigen",
    "empty-queue": "Keine Daten zur Synchronisation verfügbar",
    "empty-queue-description": "Es existieren keine Daten zum Synchronisieren. Sie können mit Ihrer Arbeit fortfahren.",
    "enable-auto-sync": "Automatische Synchronisierung",
    "enable-auto-sync-desc": "Die automatische Synchronisierung ermöglicht das sofortige Speichern Ihrer lokalen Daten. <br><br> Wenn Sie disen Prozess manuell handhaben wollen, um Ihre lokalen Änderungen zu überprüfen, können Sie die automatische Synchronisation stoppen.",
    "error": "Fehler",
    "error-occured": "Ein Fehler ist aufgetreten.",
    "go-back": "Zurück",
    "hint": {
      "button": "Ok",
      "description": "Es wurde ein neuer Eintrag in die <b>Evan Blockchain Queue</b> hinzugefügt. <br><br> Jegliche Daten werden <b>lokal</b> gespeichert. Das ermöglicht das Arbeiten unter folgenden Aspekten: <ul> <li>offline</li> <li>schnell</li> <li>leichtgewichtig</li></ul><div class=\"evan-seperator\"></div>Um diese Daten in die Blockchain zu persitieren, navigieren Sie mit denfolgenden Interaktionsmöglichkeiten zur Queue Übersicht:<ul> <li>der <b>hellblaue Button</b> in der <b>oberen, rechten</b> Ecke des Bildschirms</li> <li>Nutzen Sie den <b>\"zeigen\"</b> Button in der <b>Toast Benachrichtigung</b> in der <b>unteren</b> Seite des Bildschirms</li></ul>",
      "show-again": "Nicht mehr anzeigen",
      "show-queue": "Queue anzeigen",
      "title": "Blockchain Queue"
    },
    "new-entry-added": "Eintrag wurde zur Blockchain-Warteschlange hinzugefügt...",
    "queue-hint": "Datensynchronisation",
    "queue-hint-description": "Diese Übersicht enthält alle für Sie lokal gespeicherten Daten. Durch Klicken auf \"Synchronisation starten\" werden die Daten des jeweiligen Segments permantent gespeichert. <br><br> <b>Bitte beachten:</b><br><br> Die Synchronisation kann mehrere Minuten in Anspruch nehmen.<br> Bitte schließen Sie nicht diese Seite / Applikation.<br> Sie können während dessen jede andere Seite der Evan Applikation verwenden.",
    "remove": "Entfernen",
    "removeQueueEntry": "Eintrag entfernen",
    "removeQueueEntryDescription": "Wollen Sie diesen Eintrag wirklich löschen? Er wird permanent von dem lokalen Speicher entfern.",
    "report-error": "Fehler senden",
    "retry": "Erneut versuchen...",
    "retry-description": "Meistens werden Synchronisationsprobleme durch Netzwerkeinschränkungen verursacht. Bitte versuchen Sie es erneut.",
    "saving": "Speicherung von",
    "show": "Anzeigen",
    "show-new-entry": "Anzeigen",
    "sidepanel-data-sets": "Datenänderungen",
    "sidepanel-empty-queue": "Alles ist aktuell",
    "sidepanel-header": "Synchronisation",
    "slider": {
      "0": "Synchronisations-Status",
      "1": "Zu speichernde Daten",
      "2": "Zu speichernde Daten"
    },
    "startsync": "Synchronisation starten",
    "sync-all": "Alle Daten synchronisieren",
    "sync-finished": "Synchronisation abgeschlossen",
    "synchronising": "Synchronisieren..."
  },
  "_loading": {
    "go-back": "zurück zur letzten DApp",
    "loaded-to-long": "Die DApp lädt länger als erwartet."
  },
  "_logging": {
    "ignore": "Ignorieren und Logs leeren",
    "log_close": "schließen",
    "log_detailed": "Detailierte Auswertung senden",
    "log_only_errors": "Fehler senden",
    "log_question_message": "Senden Sie Fehler zu Analysezwecken an die evan.network Entwickler.<br> Nutzen Sie \"Fehler senden\", um nur die aufgetretenen Fehler zu senden.<br> Mit Hilfe von \"Detailierte Auswertung senden\" lässt sich die vollständige Historie der Applikation auswerten, filtern und versenden.",
    "log_question_title": "Fehler senden",
    "logs-sent": "Vielen Dank! Ihre Logs wurden an evan.network Entwickler weitergeleitet."
  },
  "cancel": "Abbrechen",
  "edit": "Editieren",
  "error": {
    "not_implemented": "Nicht implementiert"
  },
  "evan-reload": "Aktualisieren...",
  "go-to": "Öffne",
  "go-to-dappdashboard": "zum Dashboard",
  "go-to-evan": "Zu Evan",
  "go-to-mails": "zu den Mailbox-Nachrichten",
  "go-to-queue": "Synchronisations-Details",
  "loading-dapp": "Laden...",
  "metamask": "Metamask",
  "no-alias": "Kein Alias",
  "open": "Öffnen",
  "remove": "Entfernen",
  "submit": "Akzeptieren"
}
