package com.rakshak.ai.ui

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.rakshak.ai.R

class MicroFrictionActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_micro_friction)

        val amount = intent.getStringExtra("EXTRA_AMOUNT") ?: "4,999"
        val payee = intent.getStringExtra("EXTRA_PAYEE") ?: "Unknown Merchant"

        findViewById<TextView>(R.id.tvDebitAmount)?.text = "DEBIT: - ₹$amount"
        findViewById<TextView>(R.id.tvPayeeInfo)?.text = "Recipient: $payee"

        findViewById<Button>(R.id.btnCancelPayment)?.setOnClickListener {
            // Abort payment
            finish()
        }
    }
}
