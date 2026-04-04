"""
nodes/track_order.py
--------------------
Agente especializado en rastreo de pedidos.
Extrae el ID del pedido, consulta la base de datos y formatea la respuesta.
"""
from __future__ import annotations

import logging

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from ..chatbot_state import GraphState
from ..chatbot_tools import track_order
from ..utils import build_lc_history, stream_and_collect

logger = logging.getLogger(__name__)


def create_track_order_node(llm: ChatOpenAI, db: AsyncSession):
    """Factory: retorna el nodo de rastreo con LLM y DB inyectados."""

    async def track_order_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        logger.info("[TrackOrder] ▶ Processing tracking for: '%s'", user_query)

        # 1. Extraer ID usando el LLM
        extract_prompt = (
            "Extrae el ID o código de pedido (usualmente un identificador largo de letras y números) de este mensaje.\n"
            "Si no encuentras ningún ID, responde exactamente con la palabra 'NONE'.\n"
            f"Mensaje: '{user_query}'"
        )
        extraction_resp = await llm.ainvoke([HumanMessage(content=extract_prompt)])
        order_id = extraction_resp.content.strip()

        if order_id == "NONE" or not order_id:
            reply = "Para consultar el estado de tu pedido, por favor bríndame el identificador (ID) único de tu compra."
            return {"reply": reply, "actions": [], "context": ""}

        # 2. Consultar BD
        db_reply = await track_order(order_id, db)

        # 3. Formatear amigablemente
        system = (
            "Eres el asistente de Zenda. Comunícale al usuario la información de rastreo de su pedido "
            "de forma cálida y profesional. La información técnica es la siguiente:\n\n"
            f"{db_reply}\n\n"
            "REGLA CRÍTICA PARA PAGOS NEQUI/MANUALES:\n"
            "Si la información dice que el estado es 'Pendiente de pago', PERO el usuario afirma que "
            "ya pagó, envió un comprobante o transfirió, tú NO DEBES confirmar el pago. "
            "Debes decirle muy amablemente algo como: '¡Muchas gracias por tu pago! Nuestro equipo "
            "administrativo está verificando la transferencia en nuestro Nequi. Una vez sea confirmada, "
            "el sistema actualizará tu pedido a Pagado automáticamente.'"
        )
        messages = [SystemMessage(content=system)] + build_lc_history(state)
        final_reply = await stream_and_collect(llm, messages, label="track_order")
        return {"reply": final_reply, "actions": [], "context": db_reply}

    return track_order_node
