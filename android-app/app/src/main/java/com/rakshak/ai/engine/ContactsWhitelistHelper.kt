package com.rakshak.ai.engine

import android.content.Context
import android.net.Uri
import android.provider.ContactsContract

object ContactsWhitelistHelper {

    /**
     * Checks if the phone number or sender name is saved in user's phonebook.
     * Returns true if contact exists (trusted contact -> bypass scanning).
     */
    fun isSavedContact(context: Context, phoneNumberOrSender: String): Boolean {
        if (phoneNumberOrSender.isBlank()) return false

        return try {
            val uri = Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                Uri.encode(phoneNumberOrSender)
            )
            val projection = arrayOf(ContactsContract.PhoneLookup._ID, ContactsContract.PhoneLookup.DISPLAY_NAME)
            val cursor = context.contentResolver.query(uri, projection, null, null, null)

            cursor?.use {
                val count = it.count
                count > 0
            } ?: false
        } catch (e: SecurityException) {
            // If permission not granted, treat with caution
            false
        } catch (e: Exception) {
            false
        }
    }
}
