package com.moldavite.mrdarkness;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ChatGPTPlanPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
